import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, List, MenuProps, Modal, Popover, Badge } from "antd"
import { formatMemory } from '@/utils/k8s'
import { EllipsisOutlined } from '@ant-design/icons'
import { jsonParse, formatTimestamp, removeTrailingDot } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { deleteDataVolume } from "./resource-manager"
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import TableStyles from '@/common/styles/table.module.less'

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
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, dv) => <>{dv.metadata?.namespace}</>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, vm) => {
                const status = jsonParse(vm.status)
                const conditions = statusConditions(status)
                const displayStatus = parseFloat(status.progress) === 100 ? status.phase : status.progress
                let content: any
                if (conditions.length > 0) {
                    content = (
                        <List
                            className={TableStyles["status-tips"]}
                            size="small"
                            dataSource={conditions}
                            renderItem={(item: any, index: number) => {
                                let probeTime: string = ""
                                if (item.lastProbeTime?.length > 0) {
                                    probeTime = ` [${item.lastProbeTime}]`
                                }
                                return (
                                    <List.Item>
                                        {index + 1}.{probeTime} {removeTrailingDot(item.message)}.
                                    </List.Item>
                                )
                            }}
                        />
                    )
                }
                return (
                    <Popover content={content}>
                        <Badge status={dataVolumeStatusMap[status.phase]} text={displayStatus} />
                    </Popover>
                )
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
                    <div className={TableStyles['action-bar']}>
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <EllipsisOutlined className={TableStyles['action-bar-icon']} />
                        </Dropdown>
                    </div>
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
                    content: `即将删除 "${namespace}/${name}" 磁盘，请确认。`,
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
