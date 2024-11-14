import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { ResourceType } from '@/clients/ts/types/resource'
import { getErrorMessage, openConsole } from '@/utils/utils'
import { App, Button, Dropdown, MenuProps, Modal, Spin } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { NamespaceName } from '@/clients/ts/types/namespace_name'
import { NotificationInstance } from 'antd/es/notification/interface'
import { DataDiskDrawer } from '../data-disk-drawer'
import { Link } from 'react-router-dom'
import { NetworkDrawer } from '../network-drawer'
import { NetworkConfig, updateDataDisks, updateNetwork } from '../../virtualmachine'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { clients, getPowerStateName, getResourceName } from '@/clients/clients'

interface Props {
    vm?: any
    namespace?: NamespaceName
    type: "list" | "detail"
}

const VirtualMachineManagement: React.FC<Props> = ({ vm, namespace, type }) => {
    if (!vm && !namespace) {
        return
    }

    const { notification } = App.useApp()

    const [loading, setLoading] = useState<boolean>(false)

    const [openDrawer, setOpenDrawer] = useState({ dataDisk: false, network: false })

    const [virtualMachine, setVirtualMachine] = useState<any>(vm)

    const items = itemsFunc(virtualMachine, setOpenDrawer, notification)

    let content = <EllipsisOutlined />
    if (type === "detail") {
        content = <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
    }

    const handleOpenChange = (open: boolean) => {
        if (!open || !namespace) {
            return
        }
        setLoading(true)
        clients.getResource(ResourceType.VIRTUAL_MACHINE, namespace).then(crd => {
            setVirtualMachine(crd)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }).finally(() => {
            setLoading(false)
        })
    }

    const handleConfirmDisk = (disks: any[]) => {
        if (disks.length == 0) {
            return
        }
        try {
            updateDataDisks(virtualMachine, disks)
            clients.updateResource(ResourceType.VIRTUAL_MACHINE, disks)
            setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
        } catch (err) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    const handleConfirmNetwork = (net: NetworkConfig) => {
        try {
            updateNetwork(virtualMachine, net)
            clients.updateResource(ResourceType.VIRTUAL_MACHINE, virtualMachine)
            setOpenDrawer((prevState) => ({ ...prevState, network: false }))
        } catch (err) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} delay={500}>
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

const itemsFunc = (virtualMachine: any, setOpenDrawer: any, notification: NotificationInstance) => {
    if (!virtualMachine || !virtualMachine.status) {
        return []
    }

    const namespaceName = extractNamespaceAndName(virtualMachine)
    const status = virtualMachine.status.printableStatus

    const manageVirtualMachinePowerState = (state: VirtualMachinePowerStateRequest_PowerState) => {
        clients.manageVirtualMachinePowerState(namespaceName, state).catch(err => {
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
            content: `Are you sure you want to delete "${namespaceNameKey(namespaceName)}" ${resourceName}? This action cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await clients.deleteResource(ResourceType.VIRTUAL_MACHINE, namespaceName)
                } catch (err) {
                    notification.error({
                        message: `Failed to delete ${resourceName}`,
                        description: getErrorMessage(err)
                    })
                }
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
                    onClick: () => manageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.ON),
                    label: "启动",
                    disabled: status === "Running"
                },
                {
                    key: 'restart',
                    onClick: () => manageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.REBOOT),
                    label: "重启",
                    disabled: status !== "Running"
                },
                {
                    key: 'stop',
                    onClick: () => manageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.OFF),
                    label: "关机",
                    disabled: status === "Stopped"
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => manageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT),
                    label: "强制重启",
                    disabled: status !== "Running"
                },
                {
                    key: 'force-stop',
                    onClick: () => manageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_OFF),
                    label: "强制关机",
                    disabled: status === "Stopped"
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
            onClick: () => openConsole(virtualMachine),
            disabled: status !== "Running"
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
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine.metadata.namespace}&name=${virtualMachine.metadata.name}&active=存储` }}>移除磁盘</Link>
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
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine.metadata.namespace}&name=${virtualMachine.metadata.name}&active=网络` }}>移除网络</Link>
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
    return items
}

export default VirtualMachineManagement
