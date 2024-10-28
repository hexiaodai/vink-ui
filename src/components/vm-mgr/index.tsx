import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { clients } from '@/clients/clients'
import { manageVirtualMachinePowerState } from '@/clients/virtualmachine'
import { openConsole } from '@/utils/utils'
import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { NamespaceName } from '@/apis/types/namespace_name'
import { NotificationInstance } from 'antd/es/notification/interface'

interface Props {
    vm?: any
    namespace?: NamespaceName
    type: "list" | "detail"
}

const statusEqual = (status: any, target: string) => {
    return status.printableStatus as string === target
}

const VirtualMachineManagement: React.FC<Props> = ({ vm, namespace, type }) => {
    if (!vm && !namespace) {
        return
    }

    const { notification } = App.useApp()

    const [virtualMachine, setVirtualMachine] = useState<any>(vm)

    useEffect(() => {
        fetchResource()
    }, [])

    const fetchResource = () => {
        if (!namespace) {
            return
        }

        clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, { namespace: namespace.namespace, name: namespace.name }).then((crd: any) => {
            setVirtualMachine(crd)
        }).catch((err: any) => {
            notification.error({
                message: "获取虚拟机失败",
                description: err.message
            })
        })
    }

    const handleOpen = (open: boolean) => {
        if (!open) {
            return
        }
        fetchResource()
    }

    if (!virtualMachine) {
        return
    }

    const items = itemsFunc(virtualMachine, notification)

    if (type === "detail") {
        return (
            <Dropdown menu={{ items }} trigger={['click']} onOpenChange={handleOpen}>
                <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
            </Dropdown>
        )
    }

    return (
        <Dropdown menu={{ items }} trigger={['click']} onOpenChange={handleOpen}>
            <EllipsisOutlined />
        </Dropdown>
    )
}

const itemsFunc = (virtualMachine: any, notification: NotificationInstance) => {
    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.ON, notification),
                    label: "启动",
                    disabled: statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'restart',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.REBOOT, notification),
                    label: "重启",
                    disabled: !statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'stop',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.OFF, notification),
                    label: "关机",
                    disabled: statusEqual(virtualMachine.status, "Stopped")
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, notification),
                    label: "强制重启",
                    disabled: !statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'force-stop',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, notification),
                    label: "强制关机",
                    disabled: statusEqual(virtualMachine.status, "Stopped")
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
            disabled: !statusEqual(virtualMachine.status, "Running")
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
            key: 'delete',
            danger: true,
            onClick: () => {
                Modal.confirm({
                    title: "删除虚拟机？",
                    content: `即将删除 "${virtualMachine.metadata.namespace}/${virtualMachine.metadata.name}" 虚拟机，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, virtualMachine.metadata.namespace, virtualMachine.metadata.name, { notification: notification })
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default VirtualMachineManagement
