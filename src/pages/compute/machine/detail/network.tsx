import React, { useEffect, useState } from 'react'
import { Space } from 'antd'
import { EditableProTable } from '@ant-design/pro-components'
import { classNames } from '@/utils/utils'
import { useNamespaceFromURL } from '@/hooks/use-namespace-from-url'
import { useWatchResources } from '@/hooks/use-resource'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients } from '@/clients/clients'
import { virtualMachineIPs } from '@/utils/parse-summary'
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
    const namespaceName = useNamespaceFromURL()

    const [virtualMachineSummary, setVirtualMachineSummary] = useState<any>()

    const { resources: virtualMachineSummaryMap, loading } = useWatchResources(GroupVersionResourceEnum.VIRTUAL_MACHINE_INSTANCE_SUMMARY)

    useEffect(() => {
        setVirtualMachineSummary(virtualMachineSummaryMap.get(namespaceNameKey(namespaceName)))
    }, [virtualMachineSummaryMap])

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
            const data: DataSourceType[] = await Promise.all(virtualMachine.spec.template.spec.networks.map(async (item: any) => {
                const inter = interfacesMap.get(item.name)
                if (!inter) {
                    return null
                }

                let multusCR = item.multus?.networkName || virtualMachine.spec.template.metadata.annotations["v1.multus-cni.io/default-network"];
                let ipObject = ipsMap.get(multusCR)

                const ippool = virtualMachine.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(multusCR, "ip_pool")]

                const subnet = ipObject?.spec.subnet ? await clients.fetchResource(GroupVersionResourceEnum.SUBNET, { namespace: "", name: ipObject.spec.subnet }) : null;

                const ds: DataSourceType = {
                    name: item.name,
                    default: item.pod ? true : item.multus.default,
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
            render: (_text, record, _index, action) => {
                return (
                    <Space>
                        <a
                            onClick={() => {
                                console.log(record, action)
                                action?.startEditable?.(record.name)
                            }}
                        >
                            编辑
                        </a>
                        <a
                            className={commonStyles["warning-color"]}
                            onClick={() => { }}
                        >
                            卸载
                        </a>
                        <a
                            className={commonStyles["warning-color"]}
                            onClick={() => {
                                setDataSource(dataSource.filter((item) => item.name !== record.name))
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
                onSave: async (rowKey, data, row) => {
                    console.log(rowKey, data, row)
                },
                onChange: setEditableRowKeys,
                actionRender: (_row, _config, defaultDom) => [defaultDom.save, defaultDom.cancel]
            }}
        />
    )
}
