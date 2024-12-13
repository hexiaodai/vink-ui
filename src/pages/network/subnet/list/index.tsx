import { PlusOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useRef, useState } from 'react'
import { extractNamespaceAndName } from '@/utils/k8s'
import { Link, NavLink } from 'react-router-dom'
import { dataSource, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { ResourceType } from '@/clients/ts/types/types'
import { clients, getResourceName } from '@/clients/clients'
import { useWatchResources } from '@/hooks/use-resource'
import { NotificationInstance } from 'antd/es/notification/interface'
import { subnetStatus } from '@/utils/resource-status'
import { EllipsisOutlined } from '@ant-design/icons'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'


export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(actionRef, notification)

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const { resources, loading } = useWatchResources(ResourceType.SUBNET, opts)

    const handleBatchDeleteSubnet = async () => {
        const resourceName = getResourceName(ResourceType.SUBNET)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.SUBNET, selectedRows).catch(err => {
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
            storageKey="subnets-list-table-columns"
            columns={columns}
            dataSource={dataSource(resources)}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteSubnet()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/subnets/create'><Button icon={<PlusOutlined />}>创建子网</Button></NavLink>
                ]
            }}
        />
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.conditions[*].type", name: "Status",
        items: [
            { inputValue: "Ready", values: ["Ready"], operator: '=' },
            { inputValue: "NotReady", values: ["Ready"], operator: '!=' },
        ]
    },
    { fieldPath: "spec.provider", name: "Provider", operator: "*=" },
    { fieldPath: "spec.vpc", name: "VPC", operator: "*=" },
    { fieldPath: "spec.cidrBlock", name: "CIDR", operator: "*=" },
    { fieldPath: "spec.gateway", name: "Gateway", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", name: "Namespace", operator: "*=" }
]

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => <Link to={{ pathname: "/network/subnets/detail", search: `name=${subnet.metadata.name}` }}>{subnet.metadata.name}</Link>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, subnet) => <Badge status={subnetStatus(subnet).badge} text={subnetStatus(subnet).text} />
        },
        {
            key: 'gateway',
            title: 'Gateway',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.gateway
        },
        {
            key: 'cidr',
            title: 'CIDR',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.cidrBlock
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.provider
        },
        {
            key: 'vpc',
            title: 'VPC',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.vpc
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, subnet) => {
                let nss = subnet.spec.namespaces
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
            key: 'protocol',
            title: 'Protocol',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.protocol
        },
        {
            key: 'nat',
            title: 'NAT',
            ellipsis: true,
            render: (_, subnet) => String(subnet.spec.natOutgoing)
        },
        {
            key: 'available',
            title: '可用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec.protocol == "IPv4" ? subnet.status?.v4availableIPs : subnet.status?.v6availableIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'used',
            title: '已用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec.protocol == "IPv4" ? subnet.status?.v4usingIPs : subnet.status?.v6usingIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, subnet) => {
                return formatTimestamp(subnet.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, subnet) => {
                const items = actionItemsFunc(subnet, actionRef, notification)
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

const actionItemsFunc = (subnet: any, actionRef: any, notification: NotificationInstance) => {
    const name = subnet.metadata.name

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
                    title: "Delete subnet?",
                    content: `You are about to delete the subnet "${name}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.SUBNET, extractNamespaceAndName(subnet))
                            actionRef.current?.reload()
                        } catch (err) {
                            notification.error({ message: getResourceName(ResourceType.SUBNET), description: getErrorMessage(err) })
                        }
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}
