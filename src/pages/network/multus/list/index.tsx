import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Dropdown, MenuProps, Modal, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { classNames, formatTimestamp, generateMessage, getErrorMessage, getProvider } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients, emptyOptions, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/resource'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { EllipsisOutlined } from '@ant-design/icons'
import { fieldSelector } from '@/utils/search'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [multus, setMultus] = useState<any[]>([])

    const columns = columnsFunc(actionRef, notification)

    const handleBatchDeleteMultus = async () => {
        const resourceName = getResourceName(ResourceType.MULTUS)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.MULTUS, selectedRows).catch(err => {
                    notification.error({
                        message: `Batch delete of ${resourceName} failed`,
                        description: getErrorMessage(err)
                    })
                })
            }
        })
    }

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

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
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteMultus()}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ indicator: <LoadingOutlined /> }}
            dataSource={multus}
            request={async (params) => {
                try {
                    const multus = await clients.listResources(ResourceType.MULTUS, emptyOptions({ fieldSelector: fieldSelector(params) }))
                    setMultus(multus)
                } catch (err: any) {
                    notification.error({ message: err })
                }
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'multus-list-table-columns',
                persistenceType: 'localStorage',
            }}
            rowKey={(vm) => namespaceNameKey(vm)}
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
                    <NavLink to='/network/multus/create'><Button icon={<PlusOutlined />}>创建 Multus</Button></NavLink>
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
            render: (_, mc) => mc.metadata.name
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, mc) => getProvider(mc)
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

const actionItemsFunc = (mc: any, actionRef: any, notification: NotificationInstance) => {
    const namespace = mc.metadata.namespace
    const name = mc.metadata.name

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
                    title: "Delete Multus configuration?",
                    content: `You are about to delete the Multus configuration "${namespace}/${name}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.MULTUS, { namespace: namespace, name: name })
                            actionRef.current?.reload()
                        } catch (err) {
                            notification.error({ message: getResourceName(ResourceType.MULTUS), description: getErrorMessage(err) })
                        }
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}
