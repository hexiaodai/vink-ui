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
            render: (_, ippool) => ippool.metadata.name
        },
        {
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, ippool) => ippool.spec.subnet
        },
        {
            key: 'ips',
            title: 'IPs',
            ellipsis: true,
            render: (_, ippool) => {
                let ips = ippool.spec.ips
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

                const parts = ips[0].split("..")
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
                let nss = ippool.spec.namespaces
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
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, ippool) => {
                return formatTimestamp(ippool.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, ippool) => {
                const items = actionItemsFunc(ippool, actionRef, notification)
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

const actionItemsFunc = (ippool: any, actionRef: any, notification: NotificationInstance) => {
    const name = ippool.metadata.name

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
                    title: "删除 IP 池？",
                    content: `即将删除 "${name}" IP 池，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.IPPOOL, "", name, { notification: notification }).then(() => {
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
