import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Tag } from 'antd'
import { useState } from 'react'
import { calculateAge } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { Subnet } from '@/clients/subnet'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { NavLink } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import DefaultStatus from '@/components/default-status'
import { delete2 } from '@/clients/clients'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: "spec.provider", label: "提供商", operator: "*=" },
    { fieldPath: "spec.vpc", label: "VPC", operator: "*=" },
    { fieldPath: "spec.cidrBlock", label: "CIDR", operator: "*=" },
    { fieldPath: "spec.gateway", label: "网关", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", label: "命名空间", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<Subnet>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => subnet.metadata!.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, subnet) => <DefaultStatus crd={subnet} />
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
            key: 'vpc',
            title: 'VPC',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.vpc
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, subnet) => subnet.spec?.provider
        },
        {
            key: 'age',
            title: 'Age',
            ellipsis: true,
            width: 90,
            render: (_, subnet) => calculateAge(subnet.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, subnet) => {
                const ns: NamespaceName = { namespace: "", name: subnet.metadata!.name! }
                const items: MenuProps['items'] = [
                    {
                        key: 'yaml',
                        label: 'YAML',
                        onClick: () => setYamlDetail({ open: true, nn: ns })
                    },
                    {
                        key: 'divider-1',
                        type: 'divider'
                    },
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
                                    await delete2(ResourceType.SUBNET, ns, undefined, notification)
                                }
                            })
                        },
                        label: "删除"
                    }
                ]
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined />
                    </Dropdown>
                )
            }
        }
    ]

    const close = () => {
        setYamlDetail({ open: false, nn: undefined })
    }

    return (
        <>
            <ResourceTable<Subnet>
                tableKey="subnet-list"
                resourceType={ResourceType.SUBNET}
                searchOptions={searchOptions}
                columns={columns}
                toolbar={{
                    actions: [
                        <NavLink to='/network/subnets/create'><Button icon={<PlusOutlined />}>创建子网</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.SUBNET}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
