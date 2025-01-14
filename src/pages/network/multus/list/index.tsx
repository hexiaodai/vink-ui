import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, MenuProps, Modal, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { filterNullish, formatTimestamp, getProvider } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { FieldSelector, NamespaceName } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { getNamespaceFieldSelector } from '@/utils/search'
import { deleteMultus, deleteMultuses, Multus, watchMultuses } from '@/clients/multus'
import { namespaceNameKey } from '@/utils/k8s'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace)]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace)]))
    }, [namespace])

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<Multus[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchMultuses(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleDeleteMultus = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of multus`,
            content: `Are you sure you want to delete the selected multus? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteMultuses(selectedRows, setLoading, notification)
            }
        })
    }

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    const actionItemsFunc = (mc: Multus) => {
        const ns: NamespaceName = { namespace: mc.metadata!.namespace, name: mc.metadata!.name }
        const items: MenuProps['items'] = [
            {
                key: 'delete',
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: "Confirm deletion of multus",
                        content: `Are you sure you want to delete the multus "${namespaceNameKey(ns)}"? This action cannot be undone.`,
                        okText: 'Delete',
                        okType: 'danger',
                        cancelText: 'Cancel',
                        onOk: async () => {
                            await deleteMultus(ns, undefined, notification)
                        }
                    })
                },
                label: "删除"
            }
        ]
        return items
    }

    const columns: ProColumns<Multus>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, mc) => <Link to={{ pathname: "/network/multus/detail", search: `namespace=${mc.metadata!.namespace}&name=${mc.metadata!.name}` }}>{mc.metadata!.name}</Link>
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
            render: (_, mc) => formatTimestamp(mc.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, mc) => {
                const items = actionItemsFunc(mc)
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
            key="multus-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteMultus()}>批量删除</a>
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
