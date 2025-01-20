import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, MenuProps, Modal, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey } from '@/utils/k8s'
import { Link, NavLink } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { filterNullish, formatTimestamp } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { FieldSelector } from '@/clients/ts/types/types'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { EllipsisOutlined } from '@ant-design/icons'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { DataVolume, deleteDataVolume, deleteDataVolumes, watchDataVolumes } from '@/clients/data-volume'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'
import DataVolumeStatus from '@/components/datavolume-status'

const dvImageTypeSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["image"] }

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
    }
]

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace), dvImageTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace), dvImageTypeSelector]))
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

    const handleDeleteImages = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of operating system images`,
            content: `Are you sure you want to delete the selected operating system images? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteDataVolumes(selectedRows, undefined, notification)
            }
        })
    }

    const actionItemsFunc = (dv: DataVolume) => {
        const ns = { namespace: dv.metadata!.namespace, name: dv.metadata!.name }
        const items: MenuProps['items'] = [
            {
                key: 'delete',
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: "Confirm deletion of operating system image",
                        content: `Are you sure you want to delete the operating system image "${namespaceNameKey(ns)}"? This action cannot be undone.`,
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
            render: (_, dv) => <Link to={{ pathname: "/storage/images/detail", search: `namespace=${dv.metadata!.namespace}&name=${dv.metadata!.name}` }}>{dv.metadata!.name}</Link>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <DataVolumeStatus dv={dv} />
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
            render: (_, dv) => dv.spec?.pvc?.resources?.requests?.storage
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
                const items = actionItemsFunc(dv)
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
            tableKey="image-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteImages()}>批量删除</a>
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
