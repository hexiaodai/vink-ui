import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal, Badge } from "antd"
import { formatMemory } from '@/utils/k8s'
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import { instances as annotations } from "@/apis/sdks/ts/annotation/annotations.gen"
import { clients } from "@/clients/clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => <>{dv.metadata?.name}</>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => {
                const displayStatus = parseFloat(dv.status.progress) === 100 ? dataVolumeStatusMap[dv.status.phase].text : dv.status.progress
                return <Badge status={dataVolumeStatusMap[dv.status.phase].badge} text={displayStatus} />
            }
        },
        {
            key: 'binding',
            title: '资源占用',
            ellipsis: true,
            render: (_, dv) => {
                const binding = dv.metadata.annotations[annotations.VinkVirtualmachineBinding.name]
                if (!binding) {
                    return "空闲"
                }
                const parse = JSON.parse(binding)
                return parse && parse.length > 0 ? "使用中" : "空闲"
            }
        },
        {
            key: 'type',
            title: '类型',
            ellipsis: true,
            render: (_, dv) => {
                const osname = dv.metadata?.labels[labels.VinkVirtualmachineOs.name]
                return osname && osname.length > 0 ? "系统盘" : "数据盘"
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => {
                const [value, uint] = formatMemory(dv.spec.pvc.resources.requests.storage)
                return `${value} ${uint}`
            }
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.storageClassName
        },
        {
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.accessModes[0]
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, dv) => {
                return formatTimestamp(dv.metadata.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, dv) => {
                const items = actionItemsFunc(dv, notification)
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

const actionItemsFunc = (vm: any, notification: NotificationInstance) => {
    const namespace = vm.metadata.namespace
    const name = vm.metadata.name

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
                    title: "删除系统镜像？",
                    content: `即将删除 "${namespace}/${name}" 磁盘，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.DATA_VOLUME, namespace, name, { notification: notification })
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default columnsFunc
