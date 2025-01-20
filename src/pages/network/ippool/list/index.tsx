import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { formatTimestamp } from '@/utils/utils'
import { NamespaceName } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { deleteIPPool, deleteIPPools, IPPool, watchIPPools } from '@/clients/ippool'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    { fieldPath: "spec.subnet", name: "Subnet", operator: "*=" },
    { fieldPath: "spec.ips[*]", name: "IPs", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", name: "Namespace", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<IPPool[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchIPPools(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleDeleteIPPools = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of IP pools?`,
            content: `Are you sure you want to delete the selected IP pools? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteIPPools(selectedRows, undefined, notification)
            }
        })
    }

    const actionItemsFunc = (ippool: IPPool) => {
        const ns: NamespaceName = { namespace: "", name: ippool.metadata!.name }
        const items: MenuProps['items'] = [{
            key: 'delete',
            danger: true,
            onClick: () => {
                Modal.confirm({
                    title: "Confirm deletion of IP pool",
                    content: `Are you sure you want to delete the IP pool "${ns.name}"? This action cannot be undone.`,
                    okText: 'Delete',
                    okType: 'danger',
                    cancelText: 'Cancel',
                    onOk: async () => {
                        await deleteIPPool(ns, undefined, notification)
                    }
                })
            },
            label: "删除"
        }]
        return items
    }

    const columns: ProColumns<IPPool>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, ippool) => <Link to={{ pathname: "/network/ippools/detail", search: `name=${ippool.metadata!.name}` }}>{ippool.metadata!.name}</Link>
        },
        {
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, ippool) => ippool.spec?.subnet
        },
        {
            key: 'ips',
            title: 'IPs',
            ellipsis: true,
            render: (_, ippool) => {
                let ips = ippool.spec?.ips
                if (!ips || ips.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {ips.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                const parts = (ips[0] as string).split("..")
                let display = parts.length > 1 ? `${parts[0]}..` : parts[0]

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{display}</Tag>
                        +{ips.length}
                    </Popover>
                )
            }
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, ippool) => {
                let nss = ippool.spec?.namespaces
                if (!nss || nss.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {nss.map((element, index) => (
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
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, ippool) => formatTimestamp(ippool.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, ippool) => {
                const items = actionItemsFunc(ippool)
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
            tableKey="ippool-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteIPPools()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/ippools/create'><Button icon={<PlusOutlined />}>创建 IP 池</Button></NavLink>
                ]
            }}
        />
    )
}
