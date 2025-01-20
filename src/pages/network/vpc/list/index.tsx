import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { formatTimestamp } from '@/utils/utils'
import { NamespaceName } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { deleteVPC, deleteVPCs, VPC, watchVPCs } from '@/clients/vpc'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", name: "Namespace", operator: "*=" },
    { fieldPath: "status.subnets[*]", name: "Subnet", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<VPC[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVPCs(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleDeleteVPCs = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of VPCs`,
            content: `Are you sure you want to delete the selected VPCs? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteVPCs(selectedRows, undefined, notification)
            }
        })
    }

    const actionItemsFunc = (vpc: VPC) => {
        const ns: NamespaceName = { namespace: "", name: vpc.metadata!.name }
        const items: MenuProps['items'] = [
            {
                key: 'delete',
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: "Confirm deletion of VPC",
                        content: `Are you sure you want to delete the VPC "${ns.name}"? This action cannot be undone.`,
                        okText: 'Delete',
                        okType: 'danger',
                        cancelText: 'Cancel',
                        onOk: async () => {
                            await deleteVPC(ns, undefined, notification)
                        }
                    })
                },
                label: "删除"
            }
        ]
        return items
    }

    const columns: ProColumns<VPC>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, vpc) => <Link to={{ pathname: "/network/vpcs/detail", search: `name=${vpc.metadata!.name}` }}>{vpc.metadata!.name}</Link>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vpc) => {
                let nss = vpc.spec?.namespaces
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
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, vpc) => {
                if (!vpc.status?.subnets || vpc.status.subnets.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {vpc.status.subnets.map((element, index) => (
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
            render: (_, vpc) => formatTimestamp(vpc.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, vpc) => {
                const items = actionItemsFunc(vpc)
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
            tableKey="vpcs-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteVPCs()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/vpcs/create'><Button icon={<PlusOutlined />}>创建 VPC</Button></NavLink>
                ]
            }}
        />
    )
}
