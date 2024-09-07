import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Space, Input, Button, Flex, Dropdown, MenuProps, Drawer } from 'antd'
import { SyncOutlined, PlusOutlined, SettingOutlined, DownOutlined } from '@ant-design/icons'
import { ListOptions, NameFieldSelector } from '@/utils/search'
import { DataVolumeManagement } from '../../../../../temp/apis-management/datavolume'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useDataVolumeNotification } from '@/components/notification'

const { Search } = Input

interface ToolbarProps {
    loading: boolean
    fetchData: () => void
    opts: ListOptions
    setOpts: React.Dispatch<React.SetStateAction<ListOptions>>
    selectdDataVolumes: DataVolume[]
}

interface Handler {
    batchDeleteDataVolumes: () => void
    search: (name: string) => void
    cleanSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
}

class ToolbarHandler implements Handler {
    private props: ToolbarProps
    private notification: any

    constructor(props: ToolbarProps, notification: any) {
        this.props = props
        this.notification = notification
    }

    async batchDeleteDataVolumes() {
        await DataVolumeManagement.BatchDeleteDataVolumesWithNotification(this.props.selectdDataVolumes, this.notification)
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
}

const Toolbar: React.FC<ToolbarProps> = ({ loading, fetchData, opts, setOpts, selectdDataVolumes }) => {
    const [drawer, setDrawer] = useState(false)
    const { notificationContext, showDataVolumeNotification } = useDataVolumeNotification()

    const handle = new ToolbarHandler({ loading, fetchData, opts, setOpts, selectdDataVolumes }, showDataVolumeNotification)

    const isDisabled = selectdDataVolumes?.length === 0

    const items: MenuProps['items'] = [
        {
            key: 'delete',
            label: '删除',
            danger: true,
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
                    <NavLink to='create'>
                        <Button icon={<PlusOutlined />}>制作镜像</Button>
                    </NavLink>
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
