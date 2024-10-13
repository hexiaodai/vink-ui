import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal, Badge } from "antd"
import { formatMemory } from '@/utils/k8s'
import { EllipsisOutlined } from '@ant-design/icons'
import { formatTimestamp, parseStatus, parseSpec } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { clients } from "@/clients/clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import TableColumnOperatingSystem from "@/components/table-column/operating-system"

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => dv.metadata?.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => {
                const status = parseStatus(dv)
                const displayStatus = parseFloat(status.progress) === 100 ? dataVolumeStatusMap[status.phase].text : status.progress
                return <Badge status={dataVolumeStatusMap[status.phase].badge} text={displayStatus} />
            }
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, dv) => {
                return <TableColumnOperatingSystem rootDataVolume={dv} />
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => {
                const spec = parseSpec(dv)
                const [value, uint] = formatMemory(spec.pvc?.resources?.requests?.storage)
                return `${value} ${uint}`
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, dv) => {
                return formatTimestamp(dv.metadata?.creationTimestamp)
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

const actionItemsFunc = (vm: CustomResourceDefinition, notification: NotificationInstance) => {
    const namespace = vm.metadata?.namespace!
    const name = vm.metadata?.name!

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
                    content: `即将删除 "${namespace}/${name}" 系统镜像，请确认。`,
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
