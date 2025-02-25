import { useState } from 'react'
import { App, Dropdown, Modal, Popconfirm, Space, Table, TableProps, Tag } from 'antd'
import { classNames } from '@/utils/utils'
import { getNamespaceName, namespaceNameString } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { deleteNetwork, generateNetwork } from '../../virtualmachine'
import { NetworkDrawer } from '../components/network-drawer'
import { MenuProps } from 'antd/lib'
import { EllipsisOutlined } from '@ant-design/icons'
import { manageVirtualMachinePowerState, VirtualMachine } from '@/clients/virtual-machine'
import { VirtualMachineNetwork } from '@/clients/ts/types/virtualmachine'
import { useWatchResource } from '@/hooks/use-watch-resource'
import { ResourceType } from '@/clients/ts/types/types'
import { getNetworks } from '@/clients/annotation'
import { update } from '@/clients/clients'
import commonStyles from '@/common/styles/common.module.less'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'

export default () => {
    const { notification } = App.useApp()

    const [open, setOpen] = useState(false)

    const { resource, loading } = useWatchResource<VirtualMachine>(ResourceType.VIRTUAL_MACHINE)

    const [networkConfig, setNetworkConfig] = useState<VirtualMachineNetwork>()

    const [popupVisible, setPopupVisible] = useState(false)

    const columns: TableProps<VirtualMachineNetwork>['columns'] = [
        {
            title: '网络',
            dataIndex: "network",
            ellipsis: true,
            render: (_, record) => {
                return (
                    <Space size="small">
                        {record.network}
                        {record.default ? <Tag color="default">default</Tag> : null}
                    </Space>
                )
            }
        },
        {
            title: '接口',
            dataIndex: "interface",
            ellipsis: true
        },
        {
            title: 'IP 地址',
            dataIndex: 'ip',
            ellipsis: true
        },
        {
            title: 'MAC 地址',
            dataIndex: 'mac',
            ellipsis: true,
        },
        {
            title: '子网',
            dataIndex: 'subnet',
            ellipsis: true
        },
        {
            title: 'VPC',
            dataIndex: 'vpc',
            ellipsis: true
        },
        {
            title: 'Multus',
            dataIndex: 'multus',
            ellipsis: true
        },
        {
            title: '操作',
            fixed: 'right',
            align: 'center',
            width: 100,
            render: (_, record) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'edit',
                        label: "编辑",
                        onClick: () => {
                            setNetworkConfig(record)
                            setOpen(true)
                        }
                    },
                    {
                        key: 'delete',
                        danger: true,
                        label: "删除",
                        onClick: () => {
                            if (!resource) return
                            Modal.confirm({
                                title: `Confirm remove of network`,
                                content: `Are you sure you want to remove the network "${namespaceNameString(resource)}"?`,
                                okText: 'Removal',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                okButtonProps: { disabled: false },
                                onOk: async () => {
                                    deleteNetwork(resource, record.name)
                                    await update<VirtualMachine>(resource, undefined, undefined, notification)
                                    if (resource?.status?.printableStatus === "Running") {
                                        setPopupVisible(true)
                                    }
                                }
                            })
                        }
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
        <>
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
                    className={classNames(commonStyles["small-scrollbar"])}
                    size="middle"
                    scroll={{ x: 150 * 7 }}
                    loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
                    columns={columns}
                    dataSource={getNetworks(resource)}
                    pagination={false}
                />
            </Popconfirm>

            <NetworkDrawer
                open={open}
                networkConfig={networkConfig}
                onCanel={() => setOpen(false)}
                onConfirm={async (newNetworkConfig) => {
                    if (!resource) return
                    generateNetwork(resource, newNetworkConfig)
                    await update<VirtualMachine>(resource, undefined, undefined, notification)
                    setOpen(false)
                    if (resource?.status?.printableStatus === "Running") {
                        setPopupVisible(true)
                    }
                }}
            />
        </>
    )
}
