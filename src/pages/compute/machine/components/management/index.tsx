import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { getErrorMessage, openConsole } from '@/utils/utils'
import { App, Button, Dropdown, MenuProps, Modal, Spin } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { DataDiskDrawer } from '../data-disk-drawer'
import { Link } from 'react-router-dom'
import { NetworkDrawer } from '../network-drawer'
import { NetworkConfig, updateDataDisks, updateNetwork } from '../../virtualmachine'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients, getPowerStateName, getResourceName } from '@/clients/clients'
import { deleteVirtualMachine, getVirtualMachine, manageVirtualMachinePowerState, VirtualMachine } from '@/clients/virtual-machine'

interface Props {
    namespace: NamespaceName
    type: "list" | "detail"
}

const VirtualMachineManagement: React.FC<Props> = ({ namespace, type }) => {
    const { notification } = App.useApp()

    const [loading, setLoading] = useState<boolean>(false)

    const [openDrawer, setOpenDrawer] = useState({ dataDisk: false, network: false })

    const [virtualMachine, setVirtualMachine] = useState<VirtualMachine>()

    let content = <EllipsisOutlined />
    if (type === "detail") {
        content = <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            return
        }
        setLoading(true)
        getVirtualMachine(namespace).then(vm => {
            setVirtualMachine(vm)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }).finally(() => {
            setLoading(false)
        })
    }

    const handleConfirmDisk = async (disks: any[]) => {
        if (disks.length == 0) {
            return
        }
        try {
            updateDataDisks(virtualMachine, disks)
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, virtualMachine)
            setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
        } catch (err) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    const handleConfirmNetwork = async (net: NetworkConfig) => {
        try {
            updateNetwork(virtualMachine, net)
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, virtualMachine)
            await clients.manageVirtualMachinePowerState(extractNamespaceAndName(virtualMachine), VirtualMachinePowerStateRequest_PowerState.REBOOT)
            setOpenDrawer((prevState) => ({ ...prevState, network: false }))
        } catch (err) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    const handleVirtualMachinePowerState = (state: VirtualMachinePowerStateRequest_PowerState) => {
        manageVirtualMachinePowerState({ namespace: virtualMachine?.metadata!.namespace!, name: virtualMachine?.metadata!.name! }, state).catch(err => {
            notification.error({
                message: getPowerStateName(state),
                description: getErrorMessage(err)
            })
        })
    }

    const handleDeleteVirtualMachine = () => {
        const resourceName = getResourceName(ResourceType.VIRTUAL_MACHINE)
        Modal.confirm({
            title: `Delete ${resourceName}?`,
            content: `Are you sure you want to delete "${namespaceNameKey(virtualMachine)}" ${resourceName}? This action cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                deleteVirtualMachine({ namespace: virtualMachine?.metadata!.namespace!, name: virtualMachine?.metadata!.name! }).then(err => {
                    notification.error({
                        message: `Failed to delete ${resourceName}`,
                        description: getErrorMessage(err)
                    })
                })
            }
        })
    }

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.ON),
                    label: "启动",
                    disabled: virtualMachine?.status?.printableStatus === "Running"
                },
                {
                    key: 'restart',
                    onClick: () => handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.REBOOT),
                    label: "重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'stop',
                    onClick: () => handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.OFF),
                    label: "关机",
                    disabled: virtualMachine?.status?.printableStatus === "Stopped"
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT),
                    label: "强制重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'force-stop',
                    onClick: () => handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_OFF),
                    label: "强制关机",
                    disabled: virtualMachine?.status?.printableStatus === "Stopped"
                },
            ]
        },
        {
            key: 'divider-1',
            type: 'divider'
        },
        {
            key: 'console',
            label: '控制台',
            onClick: () => {
                if (virtualMachine) {
                    openConsole(virtualMachine)
                }
            },
            disabled: virtualMachine?.status?.printableStatus !== "Running"
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'bindlabel',
            label: '绑定标签'
        },
        {
            key: 'divider-3',
            type: 'divider'
        },
        {
            key: 'disk',
            label: '磁盘',
            children: [
                {
                    key: 'disk-add',
                    onClick: () => { setOpenDrawer((prevState: any) => ({ ...prevState, dataDisk: true })) },
                    label: "新增磁盘"
                },
                {
                    key: 'disk-remove',
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine?.metadata?.namespace}&name=${virtualMachine?.metadata?.name}&active=Storage` }}>移除磁盘</Link>
                }
            ]
        },
        {
            key: 'divider-4',
            type: 'divider'
        },
        {
            key: 'network',
            label: '网络',
            children: [
                {
                    key: 'network-add',
                    onClick: () => { setOpenDrawer((prevState: any) => ({ ...prevState, network: true })) },
                    label: "新增网络"
                },
                {
                    key: 'network-remove',
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine?.metadata?.namespace}&name=${virtualMachine?.metadata?.name}&active=Network` }}>移除网络</Link>
                }
            ]
        },
        {
            key: 'divider-5',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => handleDeleteVirtualMachine(),
            label: "删除"
        }
    ]

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} delay={200}>
            <Dropdown
                menu={{ items }}
                trigger={['click']}
                onOpenChange={handleOpenChange}
                overlayStyle={{ minWidth: 85 }}
            >
                {content}
            </Dropdown>

            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}
                onConfirm={handleConfirmDisk}
            />
            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={handleConfirmNetwork}
            />
        </Spin>
    )
}

export default VirtualMachineManagement
