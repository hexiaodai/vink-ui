import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Select, Space, Tag } from 'antd'
import { useRef, useState } from 'react'
import { extractNamespaceAndName, namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { classNames, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { EllipsisOutlined } from '@ant-design/icons'
import { fieldSelector } from '@/utils/search'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [vpcs, setVpcs] = useState<any[]>([])

    const columns = columnsFunc(actionRef, notification)

    const handleBatchDeleteVPC = async () => {
        const resourceName = getResourceName(ResourceType.VPC)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.VPC, selectedRows).catch(err => {
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
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteVPC()}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ indicator: <LoadingOutlined /> }}
            dataSource={vpcs}
            request={async (params) => {
                try {
                    const vpcs = await clients.listResources(ResourceType.VPC, ListOptions.create({ fieldSelector: fieldSelector(params) }))
                    setVpcs(vpcs)
                } catch (err: any) {
                    notification.error({ message: err })
                }
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'vpc-list-table-columns',
                persistenceType: 'localStorage',
            }}
            rowKey={(vm) => namespaceName(vm.metadata)}
            search={false}
            options={{
                fullScreen: true,
                search: {
                    allowClear: true,
                    style: { width: 280 },
                    addonBefore: <Select defaultValue="metadata.name" options={[
                        { value: 'metadata.name', label: '名称' },
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/network/vpcs/create'><Button icon={<PlusOutlined />}>创建 VPC</Button></NavLink>
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
            render: (_, vpc) => vpc.metadata?.name
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vpc) => {
                let nss = vpc.spec.namespaces
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
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, vpc) => {
                if (!vpc.status?.subnets || vpc.status.subnets.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {vpc.status.subnets.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{vpc.status.subnets[0]}</Tag>
                        +{vpc.status.subnets.length}
                    </Popover>
                )
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, mc) => {
                return formatTimestamp(mc.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, mc) => {
                const items = actionItemsFunc(mc, actionRef, notification)
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

const actionItemsFunc = (m: any, actionRef: any, notification: NotificationInstance) => {
    const name = m.metadata.name

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
                    title: "Delete VPC?",
                    content: `You are about to delete the VPC "${name}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.VPC, extractNamespaceAndName(m))
                            actionRef.current?.reload()
                        } catch (err) {
                            notification.error({ message: getResourceName(ResourceType.VPC), description: getErrorMessage(err) })
                        }
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}
