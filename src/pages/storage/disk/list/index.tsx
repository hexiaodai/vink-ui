import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { filterNullish, formatTimestamp } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { FieldSelector } from '@/clients/ts/types/types'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { NotificationInstance } from 'antd/lib/notification/interface'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { EllipsisOutlined } from '@ant-design/icons'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { DataVolume, deleteDataVolume, deleteDataVolumes, watchDataVolumes } from '@/clients/data-volume'
import { namespaceNameKey } from '@/utils/k8s'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'
import DataVolumeStatus from '@/components/datavolume-status'

const dvDataTypeSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "!=", values: ["image"] }

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

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<DataVolume[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchDataVolumes(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleDeleteDataDisks = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of data disks`,
            content: `Are you sure you want to delete the selected data disks? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteDataVolumes(selectedRows, undefined, notification)
            }
        })
    }

    const actionItemsFunc = (dv: DataVolume, notification: NotificationInstance) => {
        const ns = { namespace: dv.metadata!.namespace, name: dv.metadata!.name }
        const items: MenuProps['items'] = [
            {
                key: 'delete',
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: "Confirm deletion of data disk",
                        content: `Are you sure you want to delete the data disk "${namespaceNameKey(ns)}"? This action cannot be undone.`,
                        okText: 'Delete',
                        okType: 'danger',
                        cancelText: 'Cancel',
                        onOk: async () => {
                            await deleteDataVolume(ns, undefined, notification)
                        }
                    })
                },
                label: "删除"
            }
        ]
        return items
    }

    const columns: ProColumns<DataVolume>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => <Link to={{ pathname: "/storage/disks/detail", search: `namespace=${dv.metadata!.namespace}&name=${dv.metadata!.name}` }}>{dv.metadata!.name}</Link>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <DataVolumeStatus dv={dv} />
        },
        {
            key: 'owner',
            title: 'Owner',
            ellipsis: true,
            render: (_, dv) => {
                const owners = dv.metadata!.annotations?.[annotations.VinkDatavolumeOwner.name]
                if (!owners) {
                    return
                }
                const parse: string[] = JSON.parse(owners)
                if (parse.length === 0) {
                    return
                }

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
                const osname = dv.metadata?.labels[labels.VinkOperatingSystem.name]
                return osname && osname.length > 0 ? "系统盘" : "数据盘"
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec?.pvc?.resources?.requests?.storage
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
        },
        {
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes?.[0]
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, dv) => formatTimestamp(dv.metadata!.creationTimestamp)
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

    return (
        <CustomTable
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            defaultFieldSelectors={defaultFieldSelectors}
            key="disk-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteDataDisks()}>批量删除</a>
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
