import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, Flex, MenuProps, Modal, Popover, Tag } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { clients } from "@/clients/clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, vpc) => vpc.metadata?.name
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vpc) => {
                let nss = vpc.spec.namespaces
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
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, vpc) => {
                if (!vpc.status?.subnets || vpc.status.subnets.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {vpc.status.subnets.map((element: any, index: any) => (
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
            render: (_, mc) => {
                return formatTimestamp(mc.metadata.creationTimestamp)
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

const actionItemsFunc = (m: any, actionRef: any, notification: NotificationInstance) => {
    const name = m.metadata.name

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
                    title: "删除 VPC？",
                    content: `即将删除 "${name}" VPC，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.VPC, "", name, { notification: notification }).then(() => {
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
