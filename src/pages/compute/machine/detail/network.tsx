import React, { useEffect, useState } from 'react'
import { App, Modal, Space } from 'antd'
import { EditableProTable } from '@ant-design/pro-components'
import { classNames, generateKubeovnNetworkAnnon, getErrorMessage } from '@/utils/utils'
import { useWatchResourceInNamespaceName } from '@/hooks/use-resource'
import { ResourceType } from '@/clients/ts/types/resource_type'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients, emptyOptions, getResourceName } from '@/clients/clients'
import { virtualMachine, virtualMachineIPs } from '@/utils/parse-summary'
import { defaultNetworkAnno, deleteNetwork, updateNetwork } from '../virtualmachine'
import { NotificationInstance } from 'antd/es/notification/interface'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'

type DataSourceType = {
    name: string
    default: boolean
    network: string
    interface: string
    multus: string
    vpc: string
    subnet: string
    ippool: string
    ipAddress: string
    macAddress: string
}

export default () => {
    const { notification } = App.useApp()

    const { resource: virtualMachineSummary, loading } = useWatchResourceInNamespaceName(ResourceType.VIRTUAL_MACHINE_SUMMARY)

    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])

    const { dataSource, loading: dataSourceLoading } = useDataSource(virtualMachineSummary)

    const columns = columnsFunc(virtualMachineSummary, notification)

    const handleUpdateNetwork = async (data: any) => {
        try {
            const vm = await clients.getResource(ResourceType.VIRTUAL_MACHINE, extractNamespaceAndName(virtualMachineSummary))
            const part = data.multus.split("/")
            if (part.length !== 2) {
                throw new Error("Multus CR format error")
            }
            updateNetwork(vm, {
                ...data,
                multus: { namespace: part[0], name: part[1] }
            })
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
        }
    }

    return (
        <EditableProTable<any>
            size="middle"
            className={classNames(commonStyles["small-scrollbar"])}
            rowKey="name"
            scroll={{ x: 1500 }}
            recordCreatorProps={false}
            loading={{ spinning: loading || dataSourceLoading, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            value={dataSource}
            editable={{
                type: 'single',
                editableKeys,
                onSave: async (_rowKey, data, _row) => handleUpdateNetwork(data),
                onChange: setEditableRowKeys,
                actionRender: (_row, _config, defaultDom) => [defaultDom.save, defaultDom.cancel]
            }}
        />
    )
}

const useDataSource = (virtualMachineSummary: any) => {
    const [dataSource, setDataSource] = useState<any[]>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const vm = virtualMachine(virtualMachineSummary)
        if (!vm) {
            return
        }

        const interfacesMap = new Map<string, any>(
            vm.spec.template.spec.domain.devices.interfaces.map((item: any) => [item.name, item])
        )

        const vmIPs = virtualMachineIPs(virtualMachineSummary)
        const ipsMap = new Map<string, any>(
            vmIPs?.map((item: any) => {
                const arr = item.metadata.name.split(".")
                if (arr.length >= 3) {
                    return [`${arr[1]}/${arr[2]}`, item]
                }
                return [namespaceNameKey(item), item]
            })
        )

        const fetchData = async () => {
            setLoading(true)
            const subnetSelector: string[] = []
            ipsMap.forEach(ipObj => {
                subnetSelector.push(`metadata.name=${ipObj.spec.subnet}`)
            })
            const subnets = await clients.listResources(ResourceType.SUBNET, emptyOptions({ customSelector: { fieldSelector: subnetSelector, namespaceNames: [] } }))
            const subnetMap = new Map<string, any>(
                subnets.map((crd: any) => {
                    return [crd.metadata.name, crd]
                })
            )

            const data: DataSourceType[] = await Promise.all(vm.spec.template.spec.networks.map(async (item: any) => {
                const inter = interfacesMap.get(item.name)
                if (!inter) {
                    return null
                }

                if (!vm.spec.template.metadata.annotations) {
                    vm.spec.template.metadata.annotations = {}
                }
                let multus = item.multus?.networkName || vm.spec.template.metadata.annotations[defaultNetworkAnno]
                let ipObject = ipsMap.get(multus)

                const ippool = vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(multus, "ip_pool")]

                const subnet = subnetMap.get(ipObject?.spec.subnet)

                const ds: DataSourceType = {
                    name: item.name,
                    default: item.pod ? true : item.multus.default ? true : false,
                    network: item.multus ? "multus" : "pod",
                    interface: inter.bridge ? "bridge" : inter.masquerade ? "masquerade" : inter.sriov ? "sriov" : inter.slirp ? "slirp" : "",
                    multus: multus,
                    vpc: subnet?.spec.vpc,
                    subnet: ipObject?.spec.subnet,
                    ippool: ippool,
                    ipAddress: ipObject?.spec.ipAddress,
                    macAddress: ipObject?.spec.macAddress
                }

                return ds
            }))

            setLoading(false)
            setDataSource(data.filter(Boolean))
        }
        fetchData()
    }, [virtualMachineSummary])

    return { dataSource, loading }
}

const columnsFunc = (virtualMachineSummary: any, notification: NotificationInstance) => {
    if (!virtualMachineSummary) {
        return
    }

    const handleRemoveNetwork = (netName: string) => {
        Modal.confirm({
            title: "Remove Network?",
            content: `You are about to remove the network "${namespaceNameKey(virtualMachineSummary)}". Please confirm.`,
            okText: 'Confirm Removal',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm = await clients.getResource(ResourceType.VIRTUAL_MACHINE, extractNamespaceAndName(virtualMachineSummary))
                    deleteNetwork(vm, netName)
                    await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
                } catch (err: any) {
                    notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
                }
            }
        })
    }

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
            dataIndex: 'multus',
            ellipsis: true,
            request: async () => {
                const items = await clients.listResources(ResourceType.MULTUS)
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
                const items = await clients.listResources(ResourceType.SUBNET)
                return items.map((item: any) => ({ value: item.metadata.name, label: item.metadata.name }))
            }
        },
        {
            title: 'IP 地址池',
            dataIndex: 'ippool',
            ellipsis: true,
            request: async () => {
                const items = await clients.listResources(ResourceType.IPPOOL)
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
                        <a onClick={() => { action?.startEditable?.(netcfg.name) }}>编辑</a>
                        <a
                            className={commonStyles["warning-color"]}
                            onClick={() => handleRemoveNetwork(netcfg.name)}
                        >
                            删除
                        </a>
                    </Space>
                )
            }
        }
    ]

    return columns
}