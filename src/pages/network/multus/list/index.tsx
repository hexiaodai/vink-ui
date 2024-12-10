import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, MenuProps, Modal, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { dataSource, filterNullish, formatTimestamp, generateMessage, getErrorMessage, getProvider } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients, getResourceName } from '@/clients/clients'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { EllipsisOutlined } from '@ant-design/icons'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { useWatchResources } from '@/hooks/use-resource'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import { getNamespaceFieldSelector } from '@/utils/search'

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(actionRef, notification)

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace)]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace)]))
    }, [namespace])

    const { resources, loading } = useWatchResources(ResourceType.MULTUS, opts)

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
        <CustomTable
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            defaultFieldSelectors={defaultFieldSelectors}
            storageKey="multus-list-table-columns"
            columns={columns}
            dataSource={dataSource(resources)}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteMultus()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/multus/create'><Button icon={<PlusOutlined />}>创建 Multus</Button></NavLink>
                ]
            }}
        />
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" }
]

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, mc) => <Link to={{ pathname: "/network/multus/detail", search: `namespace=${mc.metadata.namespace}&name=${mc.metadata.name}` }}>{mc.metadata.name}</Link>
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
