import { useEffect, useRef, useState } from 'react'
import { App, Modal, Space, Table, TableProps } from 'antd'
import { classNames } from '@/utils/utils'
import { namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { deleteNetwork, generateNetwork } from '../virtualmachine'
import { NetworkDrawer } from '../components/network-drawer'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { VirtualMachineSummary, watchVirtualMachineSummary } from '@/clients/virtual-machine-summary'
import { listVirtualMachineNetwork, VirtualMachineNetworkType } from '@/clients/subnet'
import { getVirtualMachine, manageVirtualMachinePowerState, updateVirtualMachine } from '@/clients/virtual-machine'
import useUnmount from '@/hooks/use-unmount'
import commonStyles from '@/common/styles/common.module.less'

export default () => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const [open, setOpen] = useState(false)

    const [networkConfig, setNetworkConfig] = useState<VirtualMachineNetworkType>()

    const abortCtrl = useRef<AbortController>()

    const [loading, setLoading] = useState(true)

    const [summary, setSummary] = useState<VirtualMachineSummary>()

    const [vmNetLoading, setVMNetLoading] = useState(true)

    const [virtualMachineNetworks, setVirtualMachineNetworks] = useState<VirtualMachineNetworkType[]>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineSummary(ns, setSummary, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useEffect(() => {
        if (!summary) {
            return
        }
        listVirtualMachineNetwork(summary, setVirtualMachineNetworks, setVMNetLoading, notification)
    }, [summary])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleConfirmNetwork = async (networkConfig: VirtualMachineNetworkType) => {
        if (!summary) {
            return
        }
        const ns = { namespace: summary.metadata!.namespace, name: summary.metadata!.name }
        const vm = await getVirtualMachine(ns, undefined, undefined, notification)
        generateNetwork(vm, networkConfig)
        await updateVirtualMachine(vm, undefined, undefined, notification)
        await manageVirtualMachinePowerState(ns, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
        setOpen(false)
    }

    const handleRemoveNetwork = (netName: string) => {
        if (!summary) {
            return
        }
        const ns = { namespace: summary.metadata!.namespace, name: summary.metadata!.name }

        Modal.confirm({
            title: `Confirm remove of network`,
            content: `Are you sure you want to remove the network "${namespaceNameKey(ns)}"?`,
            okText: 'Removal',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                const vm = await getVirtualMachine(ns, undefined, undefined, notification)
                deleteNetwork(vm, netName)
                await updateVirtualMachine(vm, undefined, undefined, notification)
                await manageVirtualMachinePowerState(ns, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
            }
        })
    }

    const columns: TableProps<VirtualMachineNetworkType>['columns'] = [
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
            ellipsis: true,
            render: (_, record) => record.multus ? namespaceNameKey(record.multus) : ""
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
                        <a className={commonStyles["warning-color"]} onClick={() => handleRemoveNetwork(record.name!)}>删除</a>
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
