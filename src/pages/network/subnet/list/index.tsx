import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Badge, Button, Dropdown, Flex, MenuProps, Modal, Popover, Select, Space, Tag } from 'antd'
import { useRef, useState } from 'react'
import { extractNamespaceAndName, namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { calcScroll, classNames, dataSource, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { ResourceType } from '@/clients/ts/types/resource'
import { clients, emptyOptions, getResourceName } from '@/clients/clients'
import { useWatchResources } from '@/hooks/use-resource'
import { ListOptions } from '@/clients/ts/types/list_options'
import { NotificationInstance } from 'antd/es/notification/interface'
import { subnetStatus } from '@/utils/resource-status'
import { EllipsisOutlined } from '@ant-design/icons'
import { fieldSelector } from '@/utils/search'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'

export default () => {
    const { notification } = App.useApp()

    const [scroll, setScroll] = useState(150 * 11)

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(actionRef, notification)

    const [opts, setOpts] = useState<ListOptions>(emptyOptions())

    const { resources: subnets, loading } = useWatchResources(ResourceType.SUBNET, opts)


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
        <ProTable<any, Params>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
            scroll={{ x: scroll }}
            rowSelection={{
                defaultSelectedRowKeys: [],
                onChange: (_, selectedRows) => {
                    setSelectedRows(selectedRows)
                }
            }}
            tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
                return (
                    <Space size={16}>
                        <span>已选 {selectedRowKeys.length} 项</span>
                        <a onClick={onCleanSelected}>取消选择</a>
                    </Space>
                )
            }}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteSubnet()}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ spinning: loading, indicator: <LoadingOutlined /> }}
            dataSource={dataSource(subnets)}
            request={async (params) => {
                setOpts({
                    ...opts,
                    fieldSelector: fieldSelector(params)
                })
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'subnet-list-table-columns',
                persistenceType: 'localStorage',
                onChange: (obj) => setScroll(calcScroll(obj))
            }}
            rowKey={(vm) => namespaceName(vm.metadata)}
            search={false}
            options={{
                fullScreen: true,
                search: {
                    allowClear: true,
                    style: { width: 280 },
                    addonBefore: <Select defaultValue="metadata.name" options={[
                        { value: 'metadata.name', label: '名称' }
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/network/subnets/create'><Button icon={<PlusOutlined />}>创建子网</Button></NavLink>
                ]
            }}
        />
    )
}

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => subnet.metadata.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, subnet) => <Badge status={subnetStatus(subnet).badge} text={subnetStatus(subnet).text} />
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
            key: 'cidr',
            title: 'CIDR',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.cidrBlock
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
