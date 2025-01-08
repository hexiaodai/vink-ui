import { useEffect, useRef, useState } from 'react'
import { App, Modal, Space, Table, TableProps } from 'antd'
import { classNames, getErrorMessage } from '@/utils/utils'
import { ResourceType } from '@/clients/ts/types/types'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients, getResourceName } from '@/clients/clients'
import { deleteNetwork, NetworkConfig, updateNetwork } from '../virtualmachine'
import { NetworkDrawer } from '../components/network-drawer'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { VirtualMachineSummary, watchVirtualMachineSummary } from '@/clients/virtual-machine-summary'
import { listSubnetsForVirtualMachine, VirtualMachineNetworkDataSourceType } from '@/clients/subnet'
import useUnmount from '@/hooks/use-unmount'
import commonStyles from '@/common/styles/common.module.less'

export default () => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const [open, setOpen] = useState(false)

    const [networkConfig, setNetworkConfig] = useState<NetworkConfig>()

    const abortCtrl = useRef<AbortController>()
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<VirtualMachineSummary>()

    const [vmNetLoading, setVMNetLoading] = useState(true)
    const [virtualMachineNetworks, setVirtualMachineNetworks] = useState<VirtualMachineNetworkDataSourceType[]>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineSummary(ns, setSummary, setLoading, abortCtrl.current.signal).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE_SUMMARY),
                description: getErrorMessage(err)
            })
        })
    }, [ns])

    useEffect(() => {
        if (!summary) {
            return
        }
        setVMNetLoading(true)
        listSubnetsForVirtualMachine(summary).then(items => {
            setVirtualMachineNetworks(items)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE_SUMMARY),
                description: getErrorMessage(err)
            })
        }).finally(() => {
            setVMNetLoading(false)
        })
    }, [summary])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(ResourceType.VIRTUAL_MACHINE_SUMMARY))
        abortCtrl.current?.abort()
    })

    const handleConfirmNetwork = async (networkConfig: NetworkConfig) => {
        const namespace = summary?.metadata?.namespace
        const name = summary?.metadata?.name
        if (!namespace || !name) {
            return
        }

        try {
            const vm = await clients.getResource(ResourceType.VIRTUAL_MACHINE, { namespace, name })
            updateNetwork(vm, networkConfig)
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
            await clients.manageVirtualMachinePowerState({ namespace, name }, VirtualMachinePowerStateRequest_PowerState.REBOOT)
            setOpen(false)
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
        }
    }

    const handleRemoveNetwork = (netName: string) => {
        Modal.confirm({
            title: "Remove Network?",
            content: `You are about to remove the network "${namespaceNameKey(summary)}". Please confirm.`,
            okText: 'Confirm Removal',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm = await clients.getResource(ResourceType.VIRTUAL_MACHINE, extractNamespaceAndName(summary))
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
                            setNetworkConfig(record)
                            setOpen(true)
                        }}>编辑</a>
                        <a className={commonStyles["warning-color"]} onClick={() => handleRemoveNetwork(record.name)}>删除</a>
                    </Space>
                )
            }
        }
    ]

    return (
        <>
            <Table
                className={classNames(commonStyles["small-scrollbar"])}
                size="middle"
                scroll={{ x: 150 * 10 }}
                loading={{ spinning: loading || vmNetLoading, delay: 500, indicator: <LoadingOutlined spin /> }}
                columns={columns}
                dataSource={virtualMachineNetworks}
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
