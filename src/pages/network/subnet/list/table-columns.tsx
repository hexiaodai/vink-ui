import { ProColumns } from "@ant-design/pro-components"
import { Badge, Dropdown, MenuProps, Modal } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, jsonParse } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { deleteSubnet } from "@/resource-manager/subnet"
import { subnetStatus } from "@/utils/resource-status"

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
                    title: "删除子网？",
                    content: `即将删除 "${name}" 子网，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await deleteSubnet(name!, notification).then(() => {
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
