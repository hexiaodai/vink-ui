import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Badge, Button, Dropdown, MenuProps, Modal, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemory, namespaceName, namespaceNameKey } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { calcScroll, classNames, dataSource, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients, emptyOptions, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/resource'
import { useWatchResources } from '@/hooks/use-resource'
import { ListOptions } from '@/clients/ts/types/list_options'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { fieldSelector } from '@/utils/search'
import { EllipsisOutlined } from '@ant-design/icons'
import { dataVolumeStatusMap } from '@/utils/resource-status'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import OperatingSystem from '@/components/operating-system'

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [scroll, setScroll] = useState(150 * 6)

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(notification)

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    const [opts, setOpts] = useState<ListOptions>(emptyOptions({ namespace: namespace, labelSelector: `${labels.VinkDatavolumeType.name}=image` }))

    const { resources: images, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts)

    const handleBatchDeleteImage = async () => {
        const resourceName = getResourceName(ResourceType.DATA_VOLUME)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.DATA_VOLUME, selectedRows).catch(err => {
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
                onChange: (_, selectedRows) => setSelectedRows(selectedRows)
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
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteImage()}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ spinning: loading, indicator: <LoadingOutlined /> }}
            dataSource={dataSource(images)}
            request={async (params) => {
                setOpts({ ...opts, fieldSelector: fieldSelector(params) })
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'virtual-image-list-table-columns',
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
                    addonBefore: <Select defaultValue="name" options={[
                        { value: 'metadata.name', label: '名称' }
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/storage/images/create'><Button icon={<PlusOutlined />}>添加镜像</Button></NavLink>
                ]
            }}
        />
    )
}

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => dv.metadata.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => {
                const displayStatus = parseFloat(dv.status.progress) === 100 ? dataVolumeStatusMap[dv.status.phase].text : dv.status.progress
                return <Badge status={dataVolumeStatusMap[dv.status.phase].badge} text={displayStatus} />
            }
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, dv) => {
                return <OperatingSystem dv={dv} />
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => {
                const [value, uint] = formatMemory(dv.spec.pvc.resources.requests.storage)
                return `${value} ${uint}`
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, dv) => {
                return formatTimestamp(dv.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, dv) => {
                const items = actionItemsFunc(dv, notification)
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

const actionItemsFunc = (vm: any, notification: NotificationInstance) => {
    const namespaceName = { namespace: vm.metadata.namespace, name: vm.metadata.name }

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
                    title: "Delete system image?",
                    content: `You are about to delete the system image "${namespaceNameKey(namespaceName)}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.DATA_VOLUME, namespaceName)
                        } catch (err: any) {
                            notification.error({ message: getResourceName(ResourceType.DATA_VOLUME), description: getErrorMessage(err) })
                        }
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}
