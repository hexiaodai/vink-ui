import { useEffect, useState } from 'react'
import { App, Modal, Space, Table, TableProps } from 'antd'
import { classNames, generateKubeovnNetworkAnnon, getErrorMessage } from '@/utils/utils'
import { useWatchResourceInNamespaceName } from '@/hooks/use-resource'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients, getResourceName } from '@/clients/clients'
import { virtualMachine, virtualMachineIPs } from '@/utils/parse-summary'
import { defaultNetworkAnno, deleteNetwork, NetworkConfig, updateNetwork } from '../virtualmachine'
import { NotificationInstance } from 'antd/es/notification/interface'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import { NetworkDrawer } from '../components/network-drawer'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
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

    const [open, setOpen] = useState(false)

    const [networkConfig, setNetworkConfig] = useState<NetworkConfig>()

    const { resource: virtualMachineSummary, loading } = useWatchResourceInNamespaceName(ResourceType.VIRTUAL_MACHINE_SUMMARY)

    const { dataSource, loading: dataSourceLoading } = useDataSource(virtualMachineSummary)

    const columns = columnsFunc(virtualMachineSummary, setOpen, setNetworkConfig, notification)

    const handleConfirmNetwork = async (networkConfig: NetworkConfig) => {
        try {
            const vm = await clients.getResource(ResourceType.VIRTUAL_MACHINE, extractNamespaceAndName(virtualMachineSummary))
            updateNetwork(vm, networkConfig)
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
            await clients.manageVirtualMachinePowerState(extractNamespaceAndName(vm), VirtualMachinePowerStateRequest_PowerState.REBOOT)
            setOpen(false)
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
        }
    }

    return (
        <>
            <Table
                className={classNames(commonStyles["small-scrollbar"])}
                size="middle"
                scroll={{ x: 150 * 10 }}
                loading={{ spinning: loading || dataSourceLoading, delay: 500, indicator: <LoadingOutlined spin /> }}
                columns={columns}
                dataSource={dataSource}
                pagination={false}
            />

            <NetworkDrawer
                open={open}
                networkConfig={networkConfig}
                onCanel={() => setOpen(false)}
                onConfirm={handleConfirmNetwork}
            />
        </>
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

        const interfaces = vm.spec?.template?.spec?.domain?.devices?.interfaces || []
        const interfacesMap = new Map<string, any>(
            interfaces.map((item: any) => [item.name, item])
        )

        const vmIPs = virtualMachineIPs(virtualMachineSummary) || []
        const ipsMap = new Map<string, any>(
            vmIPs.map((item: any) => {
                const arr = item.metadata.name.split(".")
                if (arr.length >= 3) {
                    return [`${arr[1]}/${arr[2]}`, item]
                }
                return [namespaceNameKey(item), item]
            })
        )

        const fetchData = async () => {
            setLoading(true)
            const subnetSelectors: FieldSelector[] = []
            ipsMap.forEach(ipObj => {
                subnetSelectors.push({ fieldPath: "metadata.name", operator: "=", values: [ipObj.spec.subnet] })
            })

            const subnetMap = new Map<string, any>()
            try {
                const subnets = await clients.listResources(ResourceType.SUBNET, ListOptions.create({ fieldSelectorGroup: { operator: "||", fieldSelectors: subnetSelectors } }))
                subnets.forEach((crd: any) => {
                    subnetMap.set(crd.metadata.name, crd)
                })
            } catch (err: any) {
                console.error("Failed to get subnets", err)
            }

            const networks = vm?.spec?.template?.spec?.networks || []
            const data: DataSourceType[] = await Promise.all(networks.map(async (item: any) => {
                const inter = interfacesMap.get(item.name)
                if (!inter) {
                    return null
                }

                let multus = item.multus?.networkName || vm?.spec?.template?.metadata?.annotations?.[defaultNetworkAnno]
                let ipObject = ipsMap.get(multus)

                const ippool = vm?.spec?.template?.metadata?.annotations?.[generateKubeovnNetworkAnnon(multus, "ip_pool")]

                const subnet = subnetMap.get(ipObject?.spec?.subnet)

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

const columnsFunc = (virtualMachineSummary: any, setOpen: any, setNetworkConfig: any, notification: NotificationInstance) => {
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
                    await clients.manageVirtualMachinePowerState(extractNamespaceAndName(vm), VirtualMachinePowerStateRequest_PowerState.REBOOT)
                } catch (err: any) {
                    notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
                }
            }
        })
    }

    const columns: TableProps<any>['columns'] = [
        {
            title: 'Network',
            dataIndex: "network",
            ellipsis: true
        },
        {
            title: 'Interface',
            dataIndex: "interface",
            ellipsis: true
        },
        {
            title: '默认网络',
            dataIndex: "default",
            ellipsis: true,
            render: (_, record) => record.default ? "是" : "否"
        },
        {
            title: 'IP 地址',
            dataIndex: 'ipAddress',
            ellipsis: true
        },
        {
            title: 'MAC 地址',
            dataIndex: 'macAddress',
            ellipsis: true,
        },
        {
            title: 'Multus CR',
            dataIndex: 'multus',
            ellipsis: true
        },
        {
            title: 'VPC',
            dataIndex: 'vpc',
            ellipsis: true
        },
        {
            title: '子网',
            dataIndex: 'subnet',
            ellipsis: true
        },
        {
            title: 'IP 地址池',
            dataIndex: 'ippool',
            ellipsis: true
        },
        {
            title: '操作',
            fixed: 'right',
            align: 'center',
            width: 150,
            render: (_, record) => {
                return (
                    <Space>
                        <a onClick={() => {
                            console.log(record)
                            setNetworkConfig(record)
                            setOpen(true)
                        }}>编辑</a>
                        <a className={commonStyles["warning-color"]} onClick={() => handleRemoveNetwork(record.name)}>删除</a>
                    </Space>
                )
            }
        }
    ]

    return columns
}
