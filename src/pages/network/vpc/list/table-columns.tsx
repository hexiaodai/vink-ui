import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, Flex, List, MenuProps, Modal, Popover, Tag } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, jsonParse, parseStatus } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { deleteVpc } from "@/resource-manager/vpc"

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
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
                const status = parseStatus(vpc)
                let ns = status.namespaces
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
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, vpc) => {
                const status = parseStatus(vpc)
                let subnets = status.subnets
                if (!subnets || subnets.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {subnets.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{subnets[0]}</Tag>
                        +{subnets.length}
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
    const name = m.metadata?.name

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
                        await deleteVpc(name!, notification).then(() => {
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
