import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal, Badge } from "antd"
import { formatMemory } from '@/utils/k8s'
import { EllipsisOutlined } from '@ant-design/icons'
import { jsonParse, formatTimestamp, parseStatus } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { deleteDataVolume } from "@/resource-manager/datavolume"
import TableColumnOperatingSystem from "@/components/table-column/operating-system"

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
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
                const status = parseStatus(dv)
                const displayStatus = parseFloat(status.progress) === 100 ? dataVolumeStatusMap[status.phase].text : status.progress
                return <Badge status={dataVolumeStatusMap[status.phase].badge} text={displayStatus} />
            }
        },
        // {
        //     key: 'status',
        //     title: '状态',
        //     ellipsis: true,
        //     render: (_, vm) => {
        //         const status = jsonParse(vm.status)
        //         const conditions = statusConditions(status)
        //         const displayStatus = parseFloat(status.progress) === 100 ? status.phase : status.progress
        //         let content: any
        //         if (conditions.length > 0) {
        //             content = (
        //                 <List
        //                     className={TableStyles["status-tips"]}
        //                     size="small"
        //                     dataSource={conditions}
        //                     renderItem={(item: any, index: number) => {
        //                         let probeTime: string = ""
        //                         if (item.lastProbeTime?.length > 0) {
        //                             probeTime = ` [${item.lastProbeTime}]`
        //                         }
        //                         return (
        //                             <List.Item>
        //                                 {index + 1}.{probeTime} {removeTrailingDot(item.message)}.
        //                             </List.Item>
        //                         )
        //                     }}
        //                 />
        //             )
        //         }
        //         return (
        //             <Popover content={content}>
        //                 <Badge status={dataVolumeStatusMap[status.phase]} text={displayStatus} />
        //             </Popover>
        //         )
        //     }
        // },
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
                const spec = jsonParse(dv.spec)
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
    const namespace = vm.metadata?.namespace
    const name = vm.metadata?.name

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
                        await deleteDataVolume(namespace!, name!, notification)
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

const statusConditions = (status: any) => {
    return status.conditions
        ?.filter((c: any) => c.message?.length > 0)
        .map((c: any) => ({ message: c.message, status: c.status, lastProbeTime: c.lastProbeTime })) || []
}

export default columnsFunc
