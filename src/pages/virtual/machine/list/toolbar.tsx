import { Space, Input, Button, Flex, Dropdown, MenuProps, Drawer, Checkbox } from 'antd'
import { SyncOutlined, PlusOutlined, PlayCircleOutlined, PoweroffOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { ListOptions, NameFieldSelector } from '@/utils/search'
import { ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useVirtualMachineNotification } from '@/components/notification'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'
import { TableColumns, Column } from '@/utils/table-columns'
import { CheckboxChangeEvent } from 'antd/es/checkbox'

const { Search } = Input

interface ToolbarProps {
    loading: boolean
    fetchData: () => void
    opts: ListOptions
    setOpts: React.Dispatch<React.SetStateAction<ListOptions>>
    selectdVirtuaMachines: VirtualMachine[]
    columns: TableColumns
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

    change = (e: CheckboxChangeEvent, cacheColumns: Column[], setCacheColumns: React.Dispatch<React.SetStateAction<Column[]>>, selected: Column) => {
        const newCacheColumns: Column[] = [...cacheColumns]
        newCacheColumns.forEach(item => {
            if (item.data.key === selected.data.key) {
                item.visible = e.target.checked
            }
        })
        setCacheColumns(newCacheColumns)
    }

    save = (setDrawer: React.Dispatch<React.SetStateAction<boolean>>, cacheColumns: Column[]) => {
        this.props.columns.reset(cacheColumns)
        setDrawer(false)
    }

    reset = (setCacheColumns: React.Dispatch<React.SetStateAction<Column[]>>) => {
        const deepCopyColumns: Column[] = JSON.parse(JSON.stringify(this.props.columns.columns()))
        setCacheColumns(deepCopyColumns)
    }
}

const Toolbar: React.FC<ToolbarProps> = ({ loading, fetchData, opts, setOpts, selectdVirtuaMachines, columns }) => {
    const [drawer, setDrawer] = useState(false)

    const deepCopyColumns: Column[] = JSON.parse(JSON.stringify(columns.columns()))
    const [cacheColumns, setCacheColumns] = useState(deepCopyColumns)

    useEffect(() => {
        setCacheColumns(deepCopyColumns)
    }, [drawer])

    const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()

    const handler = new ToolbarHandler({ loading, fetchData, opts, setOpts, selectdVirtuaMachines, columns }, showVirtualMachineNotification)

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
            <Drawer
                title="自定义列表项"
                open={drawer}
                onClose={() => setDrawer(false)}
                closeIcon={false}
                footer={
                    <Flex justify="space-between" align="flex-start">
                        <Space>
                            <Button type="primary" onClick={() => handler.save(setDrawer, cacheColumns)}>确定</Button>
                            <Button onClick={() => setDrawer(false)}>取消</Button>
                        </Space>
                        <Button type='text' onClick={() => handler.reset(setCacheColumns)}>重置</Button>
                    </Flex>
                }
            >
                <Space direction='vertical' size="middle">
                    {cacheColumns.map(item => (
                        <Checkbox
                            key={item.data.key}
                            checked={item.visible}
                            onChange={(e: any) => handler.change(e, cacheColumns, setCacheColumns, item)}
                        >
                            {item.data.title as string}
                        </Checkbox>
                    ))}
                </Space>
            </Drawer>
        </div>
    )
}

export default Toolbar
