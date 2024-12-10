import { PlusOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, MenuProps, Modal, Space } from 'antd'
import { useEffect, useState } from 'react'
import { formatMemory, namespaceNameKey } from '@/utils/k8s'
import { Link, NavLink } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { dataSource, filterNullish, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients, getResourceName } from '@/clients/clients'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { useWatchResources } from '@/hooks/use-resource'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { EllipsisOutlined } from '@ant-design/icons'
import { dataVolumeStatusMap } from '@/utils/resource-status'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import commonStyles from '@/common/styles/common.module.less'

const dvImageTypeSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["image"] }

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const columns = columnsFunc(notification)

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace), dvImageTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace), dvImageTypeSelector]))
    }, [namespace])

    const { resources, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts)

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
        <CustomTable
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            defaultFieldSelectors={defaultFieldSelectors}
            storageKey="image-list-table-columns"
            columns={columns}
            dataSource={dataSource(resources)}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleBatchDeleteImage()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/storage/images/create'><Button icon={<PlusOutlined />}>添加镜像</Button></NavLink>
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
        fieldPath: `metadata.labels.${replaceDots("vink.kubevm.io/virtualmachine.os")}`, name: "OS",
        items: [
            { inputValue: "Ubuntu", values: ["Ubuntu"], operator: '=' },
            { inputValue: "CentOS", values: ["CentOS"], operator: '=' },
            { inputValue: "Debian", values: ["Debian"], operator: '=' },
            { inputValue: "Linux", values: ["Linux", "Ubuntu", "CentOS", "Debian"], operator: '~=' },
            { inputValue: "Windows", values: ["Windows"], operator: '=' },
        ]
    },
]

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => <Link to={{ pathname: "/storage/images/detail", search: `namespace=${dv.metadata.namespace}&name=${dv.metadata.name}` }}>{dv.metadata.name}</Link>
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
