import { App, Dropdown, Modal, Table, TableProps, MenuProps, Space, Tag, Popconfirm } from "antd"
import { LoadingOutlined, StopOutlined } from '@ant-design/icons'
import { EllipsisOutlined } from '@ant-design/icons'
import { getNamespaceName, namespaceNameString } from "@/utils/k8s"
import { useWatchResource } from "@/hooks/use-watch-resource"
import { ResourceType } from "@/clients/ts/types/types"
import { getDisk } from "@/clients/annotation"
import { update } from "@/clients/clients"
import { mountDisk, removeDisk, unmountDisk } from "../../virtualmachine"
import { manageVirtualMachinePowerState, VirtualMachine } from "@/clients/virtual-machine"
import { useState } from "react"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"
import commonStyles from '@/common/styles/common.module.less'
import DataVolumeStatus from "@/components/datavolume-status"

export default () => {
    const { notification } = App.useApp()

    const { resource, loading } = useWatchResource<VirtualMachine>(ResourceType.VIRTUAL_MACHINE)

    const [popupVisible, setPopupVisible] = useState(false)

    const columns: TableProps<{ name: string, dataVolume?: { name: string } }>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            fixed: 'left',
            render: (_, simple) => {
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                return (
                    <Space size="small">
                        <span>{simple.name}</span>
                        {disk?.rootfs ? <Tag color="default">系统盘</Tag> : null}
                    </Space>
                )
            }
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, simple) => {
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                return <DataVolumeStatus disk={disk} />
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, simple) => {
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                return disk?.capacity
            }
        },
        {
            title: '访问模式',
            key: 'accessMode',
            ellipsis: true,
            render: (_, simple) => {
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                return disk?.accessMode
            }
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, simple) => {
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                return disk?.storageClassName
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, simple) => {
                if (!resource) return
                const disk = getDisk<VirtualMachine>(resource, simple.name)
                if (disk?.rootfs) {
                    return <StopOutlined className={commonStyles["disable-color"]} />
                }
                const items: MenuProps['items'] = [
                    {
                        key: 'mount',
                        disabled: disk?.mounted,
                        onClick: async () => {
                            mountDisk(resource, simple.name)
                            await update<VirtualMachine>(resource, undefined, undefined, notification)
                            if (resource?.status?.printableStatus === "Running") {
                                setPopupVisible(true)
                            }
                        },
                        label: "挂载"
                    },
                    {
                        key: 'unmount',
                        disabled: !disk?.mounted,
                        onClick: () => {
                            Modal.confirm({
                                title: `Confirm unmount of disk`,
                                content: `Are you sure you want to unmount the disk "${namespaceNameString(resource)}"?`,
                                okText: 'Unmount',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    unmountDisk(resource, simple.name)
                                    await update<VirtualMachine>(resource, undefined, undefined, notification)
                                    if (resource?.status?.printableStatus === "Running") {
                                        setPopupVisible(true)
                                    }
                                }
                            })
                        },
                        label: "卸载"
                    },
                    {
                        key: 'delete',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: `Confirm remove of disk`,
                                content: `Are you sure you want to remove the disk "${namespaceNameString(resource)}"?`,
                                okText: 'Removal',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    removeDisk(resource, simple.name)
                                    await update<VirtualMachine>(resource, undefined, undefined, notification)
                                    if (resource?.status?.printableStatus === "Running") {
                                        setPopupVisible(true)
                                    }
                                }
                            })
                        },
                        label: "移除"
                    }
                ]

                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined />
                    </Dropdown>
                )
            }
        }
    ]

    return (
        <Popconfirm
            title="配置已更新，是否立即重启虚拟机？"
            open={popupVisible}
            onConfirm={async () => {
                if (!resource) return
                await manageVirtualMachinePowerState(getNamespaceName(resource), VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
                setPopupVisible(false)
            }}
            onCancel={() => setPopupVisible(false)}
            okText="立即重启"
            cancelText="稍后再说"
        >
            <Table
                size="middle"
                loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
                columns={columns}
                dataSource={resource?.spec?.template?.spec?.volumes?.filter(volume => volume.dataVolume)}
                pagination={false}
            />
        </Popconfirm>
    )
}
