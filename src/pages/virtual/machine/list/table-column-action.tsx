import { Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useVirtualMachineNotification } from '@/components/notification'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'
import { TableColumnConsoleHandler } from '@/pages/virtual/machine/list/table-column-console'
import commonTableStyles from '@/common/styles/table.module.less'

interface TableColumeActionProps {
    vm: VirtualMachine
}

class TableColumeActionHandler {
    private props: TableColumeActionProps
    private notification: any

    constructor(props: TableColumeActionProps, notification: any) {
        this.props = props
        this.notification = notification
    }

    manageVirtualMachinePowerState = async (state: ManageVirtualMachinePowerStateRequestPowerState) => {
        await VirtualMachineManagement.ManageVirtualMachinePowerStateWithNotification(this.props.vm, state, this.notification)
    }

    deleteVirtualMachine = async () => {
        Modal.confirm({
            title: "删除虚拟机？",
            content: `即将删除 "${this.props.vm.namespace}/${this.props.vm.name}" 虚拟机，请确认。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            okButtonProps: {
                disabled: false,
            },
            onOk: async () => {
                await VirtualMachineManagement.DeleteVirtualMachineWithNotification(this.props.vm, this.notification)
            },
            onCancel() { }
        })
    }

    statusEqual = (status: string) => {
        return this.props.vm.virtualMachine?.status?.printableStatus as string === status
    }

    console = () => {

    }
}

const TableColumeAction: React.FC<TableColumeActionProps> = ({ vm }) => {
    const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()

    const handler = new TableColumeActionHandler({ vm }, showVirtualMachineNotification)

    const consoleHandler = new TableColumnConsoleHandler({ vm })


    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => handler.manageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.ON),
                    label: "启动",
                    disabled: handler.statusEqual("Running")
                },
                {
                    key: 'restart',
                    onClick: () => handler.manageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.UNSPECIFIED),
                    label: "重启",
                    disabled: true
                },
                {
                    key: 'stop',
                    onClick: () => handler.manageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.OFF),
                    label: "关机",
                    disabled: handler.statusEqual("Stopped")
                }
            ]
        },
        {
            key: 'divider-1',
            type: 'divider'
        },
        {
            key: 'console',
            label: '控制台',
            onClick: () => consoleHandler.open(),
            disabled: !consoleHandler.isRunning()
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
            key: 'edit',
            label: "编辑"
        },
        {
            key: 'divider-3',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => handler.deleteVirtualMachine(),
            label: "删除"
        }
    ]

    return (
        <div className={commonTableStyles['action-bar']} >
            {notificationContext}
            <Dropdown menu={{ items }} trigger={['click']}>
                <EllipsisOutlined className={commonTableStyles['action-bar-icon']} />
            </Dropdown>
        </div >
    )
}

export default TableColumeAction
