import { PlusOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { formatMemory } from '@/utils/k8s'
import { Link, NavLink } from 'react-router-dom'
import { dataSource, filterNullish, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients, getResourceName } from '@/clients/clients'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { useWatchResources } from '@/hooks/use-resource'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { dataVolumeStatusMap } from '@/utils/resource-status'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { EllipsisOutlined } from '@ant-design/icons'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'

const dvDataTypeSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "!=", values: ["image"] }

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace), dvDataTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace), dvDataTypeSelector]))
    }, [namespace])

    const { resources, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts)

    const columns = columnsFunc(notification)

    const handleBatchDeleteDataDisk = async () => {
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
        <CustomTable
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            defaultFieldSelectors={defaultFieldSelectors}
            storageKey="disk-list-table-columns"
            columns={columns}
            dataSource={dataSource(resources)}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteDataDisk()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/storage/disks/create'><Button icon={<PlusOutlined />}>添加磁盘</Button></NavLink>
                ]
            }}
        />
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.phase", name: "Status",
        items: [
            { inputValue: "Succeeded", values: ["Succeeded"], operator: '=' },
            { inputValue: "Failed", values: ["Failed"], operator: '=' },
            { inputValue: 'Provisioning', values: ["ImportInProgress", "CloneInProgress", "CloneFromSnapshotSourceInProgress", "SmartClonePVCInProgress", "CSICloneInProgress", "ExpansionInProgress", "NamespaceTransferInProgress", "PrepClaimInProgress", "RebindInProgress"], operator: '~=' },
        ]
    },
    {
        fieldPath: `metadata.labels.${replaceDots("vink.kubevm.io/datavolume.type")}`, name: "Type",
        items: [
            { inputValue: "Root", values: ["Root"], operator: '=' },
            { inputValue: "Data", values: ["Data"], operator: '=' },
        ]
    },
    // {
    //     fieldPath: `metadata.annotations.${replaceDots("vink.kubevm.io/virtualmachine.binding")}`, name: "Resource Usage",
    //     items: [
    //         { inputValue: "In Use", values: [""], operator: '!=' },
    //         { inputValue: "Idle", values: [""], operator: '=' },
    //     ]
    // },
    { fieldPath: `metadata.annotations.${replaceDots("vink.kubevm.io/virtualmachine.binding")}`, name: "Owner", operator: "*=" }
]

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => <Link to={{ pathname: "/storage/disks/detail", search: `namespace=${dv.metadata.namespace}&name=${dv.metadata.name}` }}>{dv.metadata.name}</Link>
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
        // {
        //     key: 'binding',
        //     title: '资源占用',
        //     ellipsis: true,
        //     render: (_, dv) => {
        //         const binding = dv.metadata.annotations[annotations.VinkVirtualmachineBinding.name]
        //         if (!binding) {
        //             return "空闲"
        //         }
        //         const parse = JSON.parse(binding)
        //         return parse && parse.length > 0 ? "使用中" : "空闲"
        //     }
        // },
        {
            key: 'owner',
            title: 'Owner',
            ellipsis: true,
            render: (_, dv) => {
                const owners = dv.metadata.annotations[annotations.VinkVirtualmachineBinding.name]
                if (!owners) {
                    return
                }
                const parse: string[] = JSON.parse(owners)

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {parse.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{parse[0]}</Tag>
                        +{parse.length}
                    </Popover>
                )
            }
        },
        {
            key: 'type',
            title: '类型',
            ellipsis: true,
            render: (_, dv) => {
                const osname = dv.metadata?.labels[labels.VinkVirtualmachineOs.name]
                return osname && osname.length > 0 ? "系统盘" : "数据盘"
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
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.storageClassName
        },
        {
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.accessModes[0]
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
    const namespace = vm.metadata.namespace
    const name = vm.metadata.name

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
                    content: `You are about to delete the disk "${namespace}/${name}". Please confirm.`,
                    okText: 'Confirm delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    okButtonProps: { disabled: false },
                    onOk: async () => {
                        try {
                            await clients.deleteResource(ResourceType.DATA_VOLUME, { namespace, name })
                        } catch (err) {
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
