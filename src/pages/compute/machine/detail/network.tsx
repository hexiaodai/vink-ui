import React, { useEffect, useState } from 'react'
import { App, Modal, Space } from 'antd'
import { EditableProTable } from '@ant-design/pro-components'
import { classNames } from '@/utils/utils'
import { useWatchResourceInNamespaceName } from '@/hooks/use-resource'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients } from '@/clients/clients'
import { virtualMachineIPs } from '@/utils/parse-summary'
import { deleteNetwork, updateNetwork } from '../vm'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'

type DataSourceType = {
    name: string
    default: boolean
    network: string
    interface: string
    multusCR: string
    vpc: string
    subnet: string
    ippool: string
    ipAddress: string
    macAddress: string
}

const generateKubeovnNetworkAnnon = (mutulsNamespaceName: string, name: string) => {
    const parts = mutulsNamespaceName.split('/')
    const prefix = `${parts[1]}.${parts[0]}.ovn.kubernetes.io`
    return `${prefix}/${name}`
}

export default () => {
    const { notification } = App.useApp()

    const { resource: virtualMachineSummary, loading } = useWatchResourceInNamespaceName(GroupVersionResourceEnum.VIRTUAL_MACHINE_INSTANCE_SUMMARY)

    const [dataSource, setDataSource] = useState<readonly DataSourceType[]>([])
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])

    useEffect(() => {
        const virtualMachine = virtualMachineSummary?.status?.virtualMachine
        if (!virtualMachine) {
            return
        }

        const interfacesMap = new Map<string, any>(
            virtualMachine.spec.template.spec.domain.devices.interfaces.map((item: any) => [item.name, item])
        )

        const ipsMap = new Map<string, any>(
            virtualMachineIPs(virtualMachineSummary)?.map((item: any) => {
                const arr = item.metadata.name.split(".")
                return [`${arr[1]}/${arr[2]}`, item]
            })
        )

        const fetchData = async () => {
            const subnetSelector: string[] = []
            ipsMap.forEach(ipObj => {
                subnetSelector.push(`metadata.name=${ipObj.spec.subnet}`)
            })
            const subnets = await clients.fetchResources(GroupVersionResourceEnum.SUBNET, { customFieldSelector: subnetSelector })
            const subnetMap = new Map<string, any>(
                subnets.map((crd: any) => {
                    return [crd.metadata.name, crd]
                })
            )

            const data: DataSourceType[] = await Promise.all(virtualMachine.spec.template.spec.networks.map(async (item: any) => {
                const inter = interfacesMap.get(item.name)
                if (!inter) {
                    return null
                }

                let multusCR = item.multus?.networkName || virtualMachine.spec.template.metadata.annotations["v1.multus-cni.io/default-network"];
                let ipObject = ipsMap.get(multusCR)

                const ippool = virtualMachine.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(multusCR, "ip_pool")]

                const subnet = subnetMap.get(ipObject?.spec.subnet)

                const ds: DataSourceType = {
                    name: item.name,
                    default: item.pod ? true : item.multus.default ? true : false,
                    network: item.multus ? "multus" : "pod",
                    interface: inter.bridge ? "bridge" : inter.masquerade ? "masquerade" : inter.sriov ? "sriov" : inter.slirp ? "slirp" : "",
                    multusCR: multusCR,
                    vpc: subnet?.spec.vpc,
                    subnet: ipObject?.spec.subnet,
                    ippool: ippool,
                    ipAddress: ipObject?.spec.ipAddress,
                    macAddress: ipObject?.spec.macAddress
                }

                return ds
            }))

            setDataSource(data.filter(Boolean))
        }
        fetchData()
    }, [virtualMachineSummary])

    const columns: ProColumns<DataSourceType>[] = [
        {
            title: 'Network',
            dataIndex: "network",
            ellipsis: true,
            request: async () => [{ value: "pod", label: 'pod' }, { value: "multus", label: 'multus' }]
        },
        {
            title: 'Interface',
            dataIndex: "interface",
            ellipsis: true,
            request: async () => [{ value: "masquerade", label: "masquerade" }, { value: "bridge", label: "bridge" }, { value: "slirp", label: "slirp" }, { value: "sriov", label: "sriov" }]
        },
        {
            title: '默认网络',
            dataIndex: "default",
            ellipsis: true,
            valueType: "select",
            request: async () => [{ value: true, label: '是' }, { value: false, label: '否' }],
            render: (_, record) => record.default ? "是" : "否"
        },
        {
            title: 'IP 地址',
            dataIndex: 'ipAddress',
            ellipsis: true,
            copyable: true
        },
        {
            title: 'MAC 地址',
            dataIndex: 'macAddress',
            ellipsis: true,
        },
        {
            title: 'Multus CR',
            dataIndex: 'multusCR',
            ellipsis: true,
            request: async () => {
                const items = await clients.fetchResources(GroupVersionResourceEnum.MULTUS)
                return items.map((item: any) => ({ value: namespaceNameKey(item), label: namespaceNameKey(item) }))
            }
        },
        {
            title: 'VPC',
            dataIndex: 'vpc',
            ellipsis: true,
            editable: false
        },
        {
            title: '子网',
            dataIndex: 'subnet',
            ellipsis: true,
            request: async () => {
                const items = await clients.fetchResources(GroupVersionResourceEnum.SUBNET)
                return items.map((item: any) => ({ value: item.metadata.name, label: item.metadata.name }))
            }
        },
        {
            title: 'IP 地址池',
            dataIndex: 'ippool',
            ellipsis: true,
            request: async () => {
                const items = await clients.fetchResources(GroupVersionResourceEnum.IPPOOL)
                return items.map((item: any) => ({ value: item.metadata.name, label: item.metadata.name }))
            }
        },
        {
            title: '操作',
            valueType: 'option',
            fixed: 'right',
            align: 'center',
            width: 150,
            render: (_text, netcfg, _index, action) => {
                return (
                    <Space>
                        <a
                            onClick={() => {
                                action?.startEditable?.(netcfg.name)
                            }}
                        >
                            编辑
                        </a>
                        <a
                            className={commonStyles["warning-color"]}
                            onClick={() => {
                                Modal.confirm({
                                    title: "移除网络？",
                                    content: `即将移除 "${namespaceNameKey(virtualMachineSummary)}" 网络，请确认。`,
                                    okText: '确认移除',
                                    okType: 'danger',
                                    cancelText: '取消',
                                    okButtonProps: {
                                        disabled: false,
                                    },
                                    onOk: async () => {
                                        try {
                                            const vm = await clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, { namespace: virtualMachineSummary.metadata.namespace, name: virtualMachineSummary.metadata.name })
                                            deleteNetwork(vm, netcfg.name)
                                            await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
                                            notification.success({ message: "删除成功" })
                                        } catch (err: any) {
                                            notification.error({ message: "删除失败", description: err.message })
                                        }
                                    }
                                })
                            }}
                        >
                            删除
                        </a>
                    </Space>
                )
            }
        }
    ]

    return (
        <EditableProTable<any>
            size="middle"
            className={classNames(commonStyles["small-scrollbar"])}
            rowKey="name"
            scroll={{ x: 1500 }}
            recordCreatorProps={false}
            loading={{ spinning: loading, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            value={dataSource}
            onChange={setDataSource}
            editable={{
                type: 'single',
                editableKeys,
                onSave: async (_rowKey, data, _row) => {
                    try {
                        const vm = await clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, { namespace: virtualMachineSummary.metadata.namespace, name: virtualMachineSummary.metadata.name })
                        const part = data.multusCR.split("/")
                        if (part.length !== 2) {
                            throw new Error("Multus CR 格式错误")
                        }
                        updateNetwork(vm, {
                            ...data,
                            multus: { namespace: part[0], name: part[1] }
                        })
                        console.log(vm)
                        await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
                        notification.success({ message: "更新成功" })
                    } catch (err: any) {
                        notification.error({ message: "更新失败", description: err.message })
                    }
                },
                onChange: setEditableRowKeys,
                actionRender: (_row, _config, defaultDom) => [defaultDom.save, defaultDom.cancel]
            }}
        />
    )
}
