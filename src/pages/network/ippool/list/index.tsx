import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useRef, useState } from 'react'
import { extractNamespaceAndName } from '@/utils/k8s'
import { Link, NavLink } from 'react-router-dom'
import { dataSource, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { EllipsisOutlined } from '@ant-design/icons'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { useWatchResources } from '@/hooks/use-resource'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(actionRef, notification)

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const { resources, loading } = useWatchResources(ResourceType.IPPOOL, opts)

    const handleBatchDeleteIPPool = async () => {
        const resourceName = getResourceName(ResourceType.IPPOOL)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.IPPOOL, selectedRows).catch(err => {
                    notification.error({
                        message: `Batch delete of ${resourceName} failed`,
                        description: getErrorMessage(err)
                    })
                })
            }
        })
    }

    return (
        <CustomTable
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            storageKey="ippool-list-table-columns"
            columns={columns}
            dataSource={dataSource(resources)}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteIPPool()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/ippools/create'><Button icon={<PlusOutlined />}>创建 IP 池</Button></NavLink>
                ]
            }}
        />
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    { fieldPath: "spec.subnet", name: "Subnet", operator: "*=" },
    { fieldPath: "spec.ips[*]", name: "IPs", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", name: "Namespace", operator: "*=" }
]

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, ippool) => <Link to={{ pathname: "/network/ippools/detail", search: `name=${ippool.metadata.name}` }}>{ippool.metadata.name}</Link>
        },
        {
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, ippool) => ippool.spec.subnet
        },
        {
            key: 'ips',
            title: 'IPs',
            ellipsis: true,
            render: (_, ippool) => {
                let ips = ippool.spec.ips
                if (!ips || ips.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {ips.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                const parts = ips[0].split("..")
                let display = parts.length > 1 ? `${parts[0]}..` : parts[0]

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{display}</Tag>
                        +{ips.length}
                    </Popover>
                )
            }
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, ippool) => {
                let nss = ippool.spec.namespaces
                if (!nss || nss.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {nss.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{nss[0]}</Tag>
                        +{nss.length}
                    </Popover>
                )
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, ippool) => {
                return formatTimestamp(ippool.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, ippool) => {
                const items = actionItemsFunc(ippool, actionRef, notification)
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined />
                    </Dropdown>
                )
            }
        }
    ]
    return columns
}

const actionItemsFunc = (ippool: any, actionRef: any, notification: NotificationInstance) => {
    const name = ippool.metadata.name

    const items: MenuProps['items'] = [
        {
            key: 'edit',
            label: "编辑"
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
                    title: "Delete IP pool?",
                    content: `You are about to delete the IP pool "${name}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.IPPOOL, extractNamespaceAndName(ippool))
                            actionRef.current?.reload()
                        } catch (err) {
                            notification.error({ message: getResourceName(ResourceType.IPPOOL), description: getErrorMessage(err) })
                        }
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}
