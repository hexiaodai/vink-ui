import { ProColumns } from "@ant-design/pro-components"
import { Badge, Dropdown, Flex, MenuProps, Modal, Popover, Tag } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, jsonParse } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { subnetStatus } from "@/utils/resource-status"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, subnet) => subnet.metadata.name
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
            render: (_, subnet) => subnet.spec.provider
        },
        {
            key: 'vpc',
            title: 'VPC',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.vpc
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, subnet) => {
                let nss = subnet.spec.namespaces
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
            render: (_, subnet) => subnet.spec.protocol
        },
        {
            key: 'cidr',
            title: 'CIDR',
            ellipsis: true,
            render: (_, subnet) => subnet.spec.cidrBlock
        },
        {
            key: 'nat',
            title: 'NAT',
            ellipsis: true,
            render: (_, subnet) => String(subnet.spec.natOutgoing)
        },
        {
            key: 'available',
            title: '可用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec.protocol == "IPv4" ? subnet.status?.v4availableIPs : subnet.status?.v6availableIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'used',
            title: '已用 IP 数量',
            ellipsis: true,
            render: (_, subnet) => {
                const count = subnet.spec.protocol == "IPv4" ? subnet.status?.v4usingIPs : subnet.status?.v6usingIPs
                return String(count ? count : 0)
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, subnet) => {
                return formatTimestamp(subnet.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, subnet) => {
                const items = actionItemsFunc(subnet, actionRef, notification)
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

const actionItemsFunc = (subnet: any, actionRef: any, notification: NotificationInstance) => {
    const name = subnet.metadata.name

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
