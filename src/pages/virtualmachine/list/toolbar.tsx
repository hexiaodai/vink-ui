import { Space, Input, Button, Flex, Dropdown, MenuProps, Drawer } from 'antd'
import { SyncOutlined, PlusOutlined, PlayCircleOutlined, PoweroffOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { ListOptions, NameFieldSelector } from '@/utils/search'
import { VirtualMachine } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useState } from 'react'
import commonStyles from '@/common/styles/common.module.less'

const { Search } = Input

interface ToolbarProps {
    loading: boolean
    fetchData: () => void
    opts: ListOptions
    setOpts: React.Dispatch<React.SetStateAction<ListOptions>>
    selectd: VirtualMachine[]
}

const menu = (selectd?: VirtualMachine[]) => {
    const isDisabled = !selectd || selectd.length === 0

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'power-start',
                    label: '启动',
                    disabled: isDisabled
                },
                {
                    key: 'power-restart',
                    label: '重启',
                    disabled: isDisabled
                },
                {
                    key: 'power-shutdown',
                    label: '关机',
                    disabled: isDisabled
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
            disabled: isDisabled
        }
    ]

    return { items }
}

const Toolbar: React.FC<ToolbarProps> = ({ loading, fetchData, opts, setOpts, selectd }) => {
    const [drawer, setDrawer] = useState(false)

    const handleSearch = (name: string) => {
        setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: NameFieldSelector(name) } })
    }

    const handleCleanSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= 0) {
            setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: undefined } })
        }
    }

    return (
        <>
            <Flex justify="space-between" align="flex-start">
                <Space>
                    <Button
                        loading={loading}
                        icon={<SyncOutlined />}
                        onClick={() => fetchData()}
                    />
                    <Button icon={<PlusOutlined />} href='/virtualmachines/create'>创建虚拟机</Button>
                    <Button disabled={selectd.length === 0} icon={<PlayCircleOutlined />}>启动</Button>
                    <Button disabled={selectd.length === 0} danger icon={<PoweroffOutlined />}>关机</Button>
                    <Dropdown menu={menu(selectd)} trigger={['click']}>
                        <Button>
                            <Space>
                                批量操作
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                    <Search
                        allowClear
                        onChange={handleCleanSearch}
                        placeholder="默认搜索名称"
                        onSearch={handleSearch}
                        className={commonStyles.sw}
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
        </>
    )
}

export default Toolbar
