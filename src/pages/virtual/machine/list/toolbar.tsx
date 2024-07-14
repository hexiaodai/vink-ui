import { Space, Input, Button, Flex, Dropdown, MenuProps } from 'antd'
import { SyncOutlined, PlusOutlined, PlayCircleOutlined, PoweroffOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { ListOptions, NameFieldSelector } from '@/utils/search'
import { ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useVirtualMachineNotification } from '@/components/notification'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'
import { StoreColumn } from '@/utils/table-columns'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import TableColumnMgr from '@/components/table-column-mgr'
import { TableColumnStore } from '@/components/table-column-mgr/store'

const { Search } = Input

interface ToolbarProps {
    loading: boolean
    fetchData: () => void
    opts: ListOptions
    setOpts: React.Dispatch<React.SetStateAction<ListOptions>>
    selectdVirtuaMachines: VirtualMachine[]
    store: TableColumnStore
    onSaveCustomColumns: () => void
}

class ToolbarHandler {
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

    change = (e: CheckboxChangeEvent, cacheColumns: StoreColumn[], setCacheColumns: React.Dispatch<React.SetStateAction<StoreColumn[]>>, selected: StoreColumn) => {
        const newCacheColumns: StoreColumn[] = [...cacheColumns]
        newCacheColumns.forEach(item => {
            if (item.original.key === selected.original.key) {
                item.visible = e.target.checked
            }
        })
        setCacheColumns(newCacheColumns)
    }
}

const Toolbar: React.FC<ToolbarProps> = ({ loading, fetchData, opts, setOpts, selectdVirtuaMachines, store, onSaveCustomColumns }) => {
    const [drawer, setDrawer] = useState(false)

    const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()

    const handler = new ToolbarHandler({ loading, fetchData, opts, setOpts, selectdVirtuaMachines, store, onSaveCustomColumns }, showVirtualMachineNotification)

    const isDisabled = selectdVirtuaMachines?.length === 0

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'power-start',
                    label: '启动',
                    onClick: () => handler.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.ON),
                    disabled: !handler.isAnySelectedVmInStatus("Stopped")
                },
                {
                    key: 'power-restart',
                    label: '重启',
                    disabled: true
                },
                {
                    key: 'power-shutdown',
                    label: '关机',
                    onClick: () => handler.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.OFF),
                    disabled: !handler.isAnySelectedVmInStatus("Running")
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
            onClick: () => handler.batchDeleteVirtualMachines(),
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
                        onClick={() => handler.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.ON)}
                        disabled={!handler.isAnySelectedVmInStatus("Stopped")}
                        icon={<PlayCircleOutlined />}
                    >
                        启动
                    </Button>
                    <Button
                        onClick={() => handler.batchManageVirtualMachinePowerState(ManageVirtualMachinePowerStateRequestPowerState.OFF)}
                        disabled={!handler.isAnySelectedVmInStatus("Running")}
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
                        onChange={handler.cleanSearch}
                        onSearch={handler.search}
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

            <TableColumnMgr store={store} open={drawer} onSave={onSaveCustomColumns} onClose={() => setDrawer(false)} />
        </div>
    )
}

export default Toolbar
