import { ProColumns } from "@ant-design/pro-components"
import { Badge, Dropdown, Flex, MenuProps, Modal, Popover, Tag } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, jsonParse, parseSpec } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { subnetStatus } from "@/utils/resource-status"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => subnet.metadata?.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, subnet) => <Badge status={subnetStatus(subnet).badge} text={subnetStatus(subnet).text} />
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                return spec.provider
            }
        },
        {
            key: 'vpc',
            title: 'VPC',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                return spec.vpc
            }
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = parseSpec(subnet)
                let ns = spec.namespaces
                if (!ns || ns.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {ns.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{ns[0]}</Tag>
                        +{ns.length}
                    </Popover>
                )
            }
        },
        {
            key: 'protocol',
            title: 'Protocol',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                return spec.protocol
            }
        },
        {
            key: 'cidr',
            title: 'CIDR',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                return spec.cidrBlock
            }
        },
        {
            key: 'nat',
            title: 'NAT',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                return String(spec.natOutgoing)
            }
        },
        {
            key: 'available',
            title: '可用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                const status = jsonParse(subnet.status)
                const count = spec.protocol == "IPv4" ? status?.v4availableIPs : status?.v6availableIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'used',
            title: '已用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const spec = jsonParse(subnet.spec)
                const status = jsonParse(subnet.status)
                const count = spec.protocol == "IPv4" ? status?.v4usingIPs : status?.v6usingIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, mc) => {
                return formatTimestamp(mc.metadata?.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, mc) => {
                const items = actionItemsFunc(mc, actionRef, notification)
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

const actionItemsFunc = (m: CustomResourceDefinition, actionRef: any, notification: NotificationInstance) => {
    const name = m.metadata?.name!

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
                    title: "删除子网？",
                    content: `即将删除 "${name}" 子网，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.SUBNET, "", name, { notification: notification }).then(() => {
                            actionRef.current?.reload()
                        })
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default columnsFunc
