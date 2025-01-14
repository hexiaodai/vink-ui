import { PlusOutlined } from '@ant-design/icons'
import { App, Badge, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { formatTimestamp } from '@/utils/utils'
import { NamespaceName } from '@/clients/ts/types/types'
import { subnetStatus } from '@/utils/resource-status'
import { EllipsisOutlined } from '@ant-design/icons'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { deleteSubnet, deleteSubnets, Subnet, watchSubnets } from '@/clients/subnet'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.conditions[*].type", name: "Status",
        items: [
            { inputValue: "Ready", values: ["Ready"], operator: '=' },
            { inputValue: "NotReady", values: ["Ready"], operator: '!=' },
        ]
    },
    { fieldPath: "spec.provider", name: "Provider", operator: "*=" },
    { fieldPath: "spec.vpc", name: "VPC", operator: "*=" },
    { fieldPath: "spec.cidrBlock", name: "CIDR", operator: "*=" },
    { fieldPath: "spec.gateway", name: "Gateway", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", name: "Namespace", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<Subnet[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchSubnets(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleDeleteSubnets = async () => {
        Modal.confirm({
            title: `Confirm batch deletion of subnets`,
            content: `Are you sure you want to delete the selected subnets? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteSubnets(selectedRows, undefined, notification)
            }
        })
    }

    const actionItemsFunc = (subnet: Subnet) => {
        const ns: NamespaceName = { namespace: "", name: subnet.metadata!.name! }

        const items: MenuProps['items'] = [
            {
                key: 'delete',
                danger: true,
                onClick: () => {
                    Modal.confirm({
                        title: "Confirm deletion of subnet",
                        content: `Are you sure you want to delete the subnet "${ns.name}"? This action cannot be undone.`,
                        okText: 'Delete',
                        okType: 'danger',
                        cancelText: 'Cancel',
                        onOk: async () => {
                            await deleteSubnet(ns, undefined, notification)
                            actionRef.current?.reload()
                        }
                    })
                },
                label: "删除"
            }
        ]
        return items
    }

    const columns: ProColumns<Subnet>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => <Link to={{ pathname: "/network/subnets/detail", search: `name=${subnet.metadata!.name}` }}>{subnet.metadata!.name}</Link>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, subnet) => <Badge status={subnetStatus(subnet).badge} text={subnetStatus(subnet).text} />
        },
        {
            key: 'gateway',
            title: 'Gateway',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.gateway
        },
        {
            key: 'cidr',
            title: 'CIDR',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.cidrBlock
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.provider
        },
        {
            key: 'vpc',
            title: 'VPC',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.vpc
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, subnet) => {
                let nss = subnet.spec?.namespaces
                if (!nss || nss.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {nss.map((element: any, index: any) => (
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
            key: 'protocol',
            title: 'Protocol',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.protocol
        },
        {
            key: 'nat',
            title: 'NAT',
            ellipsis: true,
            render: (_, subnet) => String(subnet.spec?.natOutgoing)
        },
        {
            key: 'available',
            title: '可用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec?.protocol == "IPv4" ? subnet.status?.v4availableIPs : subnet.status?.v6availableIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'used',
            title: '已用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec?.protocol == "IPv4" ? subnet.status?.v4usingIPs : subnet.status?.v6usingIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, subnet) => formatTimestamp(subnet.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, subnet) => {
                const items = actionItemsFunc(subnet)
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
            key="subnets-list-table-columns"
            columns={columns}
            dataSource={resources}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => handleDeleteSubnets()}>批量删除</a>
                    </Space>
                )
            }}
            toolbar={{
                actions: [
                    <NavLink to='/network/subnets/create'><Button icon={<PlusOutlined />}>创建子网</Button></NavLink>
                ]
            }}
        />
    )
}
