import { Space, Input, Button, Flex, Dropdown, MenuProps, Drawer } from 'antd'
import { SyncOutlined, PlusOutlined, PlayCircleOutlined, PoweroffOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { ListOptions, NameFieldSelector } from '@/utils/search'
import { ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useVirtualMachineNotification } from '@/components/notification'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'

const { Search } = Input

interface ToolbarProps {
    loading: boolean
    fetchData: () => void
    opts: ListOptions
    setOpts: React.Dispatch<React.SetStateAction<ListOptions>>
    selectdVirtuaMachines: VirtualMachine[]
}

interface Handler {
    batchManageVirtualMachinePowerState: (state: ManageVirtualMachinePowerStateRequestPowerState) => void
    batchDeleteVirtualMachines: () => void
    search: (name: string) => void
    cleanSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
    isAnySelectedVmInStatus: (status: string) => boolean
}

class ToolbarHandler implements Handler {
    private props: ToolbarProps
    private notification: any

    constructor(props: ToolbarProps, notification: any) {
        this.props = props
        this.notification = notification
    }

    async batchManageVirtualMachinePowerState(state: ManageVirtualMachinePowerStateRequestPowerState) {
        await VirtualMachineManagement.BatchManageVirtualMachinePowerStateWithNotification(this.props.selectdVirtuaMachines, state, this.notification)
    }

    async batchDeleteVirtualMachines() {
        await VirtualMachineManagement.BatchDeleteVirtualMachinesWithNotification(this.props.selectdVirtuaMachines, this.notification)
    }

    search = (name: string) => {
        this.props.setOpts({ ...this.props.opts, opts: { ...this.props.opts.opts, fieldSelector: NameFieldSelector(name) } })
    }

    cleanSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length > 0) {
            return
        }
        this.props.setOpts({ ...this.props.opts, opts: { ...this.props.opts.opts, fieldSelector: undefined } })
    }

    isAnySelectedVmInStatus = (status: string) => {
        if (!this.props.selectdVirtuaMachines || this.props.selectdVirtuaMachines.length === 0) {
            return false
        }
        return (this.props.selectdVirtuaMachines.some(vm => vm.virtualMachine?.status?.printableStatus as string === status))
    }
}

const Toolbar: React.FC<ToolbarProps> = ({ loading, fetchData, opts, setOpts, selectdVirtuaMachines }) => {
    const [drawer, setDrawer] = useState(false)
    const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()

    const handle = new ToolbarHandler({ loading, fetchData, opts, setOpts, selectdVirtuaMachines }, showVirtualMachineNotification)

    const isDisabled = selectdVirtuaMachines?.length === 0

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'power-start',
                    label: '启动',
                    onClick: () => handle.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.ON),
                    disabled: !handle.isAnySelectedVmInStatus("Stopped")
                },
                {
                    key: 'power-restart',
                    label: '重启',
                    disabled: true
                },
                {
                    key: 'power-shutdown',
                    label: '关机',
                    onClick: () => handle.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.OFF),
                    disabled: !handle.isAnySelectedVmInStatus("Running")
                }
            ]
        },
        {
            key: 'divider-1',
            type: 'divider',
        },
        {
            key: 'bindlabel',
            label: '绑定标签',
            disabled: isDisabled
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: () => handle.batchDeleteVirtualMachines(),
            disabled: isDisabled
        }
    ]

    return (
        <div>
            {notificationContext}
            <Flex justify="space-between" align="flex-start">
                <Space>
                    <Button
                        loading={loading}
                        icon={<SyncOutlined />}
                        onClick={() => fetchData()}
                    />
                    <NavLink to='/virtual/machines/create'>
                        <Button icon={<PlusOutlined />}>创建虚拟机</Button>
                    </NavLink>
                    <Button
                        onClick={() => handle.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.ON)}
                        disabled={!handle.isAnySelectedVmInStatus("Stopped")}
                        icon={<PlayCircleOutlined />}
                    >
                        启动
                    </Button>
                    <Button
                        onClick={() => handle.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.OFF)}
                        disabled={!handle.isAnySelectedVmInStatus("Running")}
                        danger
                        icon={<PoweroffOutlined />}
                    >
                        关机
                    </Button>
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <Button>
                            <Space>
                                批量操作
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                    <Search
                        allowClear
                        onChange={handle.cleanSearch}
                        onSearch={handle.search}
                        placeholder="默认搜索名称"
                    />
                </Space>
                <Space>
                    <Button onClick={() => setDrawer(true)}>
                        <Space>
                            <SettingOutlined />
                            列
                        </Space>
                    </Button>
                </Space>
            </Flex>
            <Drawer
                title="自定义列表项"
                open={drawer}
                onClose={() => setDrawer(false)}
                closeIcon={false}
                footer={
                    <Flex justify="space-between" align="flex-start">
                        <Space>
                            <Button type="primary">确定</Button>
                            <Button onClick={() => setDrawer(false)}>取消</Button>
                        </Space>
                        <Button type='text'>重置</Button>
                    </Flex>
                }
            >
            </Drawer>
        </div>
    )
}

export default Toolbar
