import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal } from "antd"
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, jsonParse } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { clients } from "@/clients/clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"

const columnsFunc = (actionRef: any, notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, mc) => mc.metadata?.name
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, mc) => {
                const kubeovn = "kube-ovn"
                const spec = jsonParse(mc.spec)
                if (!spec) return
                const config = jsonParse(spec.config)
                if (!config) return
                if (config.type == kubeovn) {
                    return config.provider
                }
                if (!config.plugins) return
                for (let i = 0; i < config.plugins.length; i++) {
                    const plugin = config.plugins[i]
                    if (plugin.type == kubeovn) {
                        return plugin.provider
                    }
                }
                return
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
    const namespace = m.metadata?.namespace!
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
                    title: "删除 Multus 配置？",
                    content: `即将删除 "${namespace}/${name}" Multus 配置，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.MULTUS, namespace, name, { notification: notification }).then(() => {
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
