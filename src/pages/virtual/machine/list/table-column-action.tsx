import { Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine, VirtualMachineManagement } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useErrorNotification } from '@/components/notification'
import commonTableStyles from '@/common/styles/table.module.less'

interface TableColumeProps {
    vm: VirtualMachine
}

const TableColumeAction: React.FC<TableColumeProps> = ({ vm }) => {
    const { contextHolder, showErrorNotification } = useErrorNotification()

    const handlePowerState = async (vm: VirtualMachine, op: ManageVirtualMachinePowerStateRequestPowerState) => {
        try {
            const request = {
                namespace: vm.namespace,
                name: vm.name,
                powerState: op,
            }
            await VirtualMachineManagement.ManageVirtualMachinePowerState(request)
        } catch (err) {
            showErrorNotification('Operate virtual machine power', err)
        } finally { }
    }

    const handleDelete = async (vm: VirtualMachine) => {
        Modal.confirm({
            title: "删除虚拟机？",
            content: `即将删除虚拟机 "${vm.namespace}/${vm.name}"，请确认。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            okButtonProps: {
                disabled: false,
            },
            onOk: async () => {
                await doDelete()
            },
            onCancel() { },
        })

        const doDelete = async () => {
            try {
                const request = {
                    namespace: vm.namespace,
                    name: vm.name,
                }
                await VirtualMachineManagement.DeleteVirtualMachine(request)
            } catch (err) {
                showErrorNotification('Delete virtual machine', err)
            } finally {
            }
        }
    }

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.ON),
                    label: "启动"
                },
                {
                    key: 'restart',
                    onClick: () => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.UNSPECIFIED),
                    label: "重启"
                },
                {
                    key: 'stop',
                    onClick: () => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.OFF),
                    label: "关机"
                }
            ]
        },
        {
            key: 'divider-1',
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
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => handleDelete(vm),
            label: "删除"
        }
    ]
    return (
        <div className={commonTableStyles['action-bar']} >
            {contextHolder}
            < Dropdown menu={{ items }} trigger={['click']}>
                <EllipsisOutlined className={commonTableStyles['action-bar-icon']} />
            </Dropdown>
        </div >
    )
}

export default TableColumeAction
