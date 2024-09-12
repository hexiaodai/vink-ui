import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, List, MenuProps, Modal, Popover, Badge } from "antd"
import { formatMemory, namespaceName } from '@/utils/k8s'
import { CodeOutlined, EllipsisOutlined } from '@ant-design/icons'
import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { jsonParse, formatTimestamp, removeTrailingDot } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { virtualMachineStatusMap } from "@/utils/resource-status"
import { deleteVirtualMachine, manageVirtualMachinePowerState } from "./resource-manager"
import TableColumnOperatingSystem from "@/components/table-column/operating-system"
import TableStyles from '@/common/styles/table.module.less'
import CommonStyles from '@/common/styles/common.module.less'

const columnsFunc = (virtualMachineInstance: Map<string, CustomResourceDefinition>, rootDisk: Map<string, CustomResourceDefinition>, node: Map<string, CustomResourceDefinition>, notification: NotificationInstance) => {
    const columns: ProColumns<CustomResourceDefinition>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, vm) => <>{vm.metadata?.name}</>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vm) => <>{vm.metadata?.namespace}</>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, vm) => {
                const status = jsonParse(vm.status)
                const conditions = statusConditions(status)
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
                        <Badge status={virtualMachineStatusMap[status.printableStatus]} text={status.printableStatus} />
                    </Popover>
                )
            }
        },
        {
            key: 'console',
            title: '控制台',
            width: 90,
            render: (_, vm) => {
                const status = jsonParse(vm.status)
                const namespace = vm.metadata?.namespace
                const name = vm.metadata?.name
                const isRunning = status?.printableStatus as string === "Running"

                return (
                    <a href='#'
                        className={isRunning ? "" : CommonStyles["a-disable"]}
                        onClick={() => { openConsole(namespace!, name!, status) }}
                    >
                        <CodeOutlined />
                    </a>
                )
            }
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, vm) => {
                const rd = rootDisk.get(namespaceName(vm.metadata))
                return <TableColumnOperatingSystem rootDataVolume={rd} />
            }
        },
        {
            key: 'ipv4',
            title: 'IPv4',
            ellipsis: true,
            render: (_, vm) => {
                const vmi = virtualMachineInstance.get(namespaceName(vm.metadata))
                const status = jsonParse(vmi?.status)
                const interfaces = status.interfaces || []
                const ips = interfaces.flatMap((iface: any) => iface.ipAddresses)
                const content = (
                    <List
                        size="small"
                        dataSource={ips}
                        renderItem={(ip: string) => (
                            <List.Item>{ip}</List.Item>
                        )}
                    />
                )
                return (
                    <Popover content={content}>
                        {interfaces[0]?.ipAddress}
                    </Popover>
                )
            }
        },
        {
            key: 'cpu',
            title: '处理器',
            ellipsis: true,
            render: (_, vm) => {
                const spec = jsonParse(vm.spec)
                let core = spec.template?.spec?.domain?.cpu?.cores
                return core ? `${core} Core` : ''
            }
        },
        {
            key: 'memory',
            title: '内存',
            ellipsis: true,
            render: (_, vm) => {
                const spec = jsonParse(vm.spec)
                const [value, unit] = formatMemory(spec.template?.spec?.domain?.resources?.requests?.memory)
                return `${value} ${unit}`
            }
        },
        {
            key: 'node',
            title: '节点',
            ellipsis: true,
            render: (_, vm) => {
                const vmi = virtualMachineInstance.get(namespaceName(vm.metadata))
                const status = jsonParse(vmi?.status)
                return status?.nodeName
            }
        },
        {
            key: 'nodeIP',
            title: '节点 IP',
            ellipsis: true,
            render: (_, vm) => {
                const vmi = virtualMachineInstance.get(namespaceName(vm.metadata))
                const vmiStatus = jsonParse(vmi?.status)
                const host = node.get(vmiStatus.nodeName)
                const status = jsonParse(host?.status)
                const interfaces = status.addresses || []
                const content = (
                    <List
                        size="small"
                        dataSource={interfaces}
                        renderItem={(iface: any) => (
                            <List.Item>{iface.type}: {iface.address}</List.Item>
                        )}
                    />
                )
                return (
                    <Popover content={content}>
                        {interfaces[0]?.address}
                    </Popover>
                )
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, vm) => {
                return formatTimestamp(vm.metadata?.creationTimestamp)
            }
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, vm) => {
                const items = actionItemsFunc(vm, notification)
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

const statusConditions = (status: any) => {
    return status.conditions
        ?.filter((c: any) => c.message?.length > 0)
        .map((c: any) => ({ message: c.message, status: c.status, lastProbeTime: c.lastProbeTime })) || []
}

const openConsole = (namespace: string, name: string, status: any) => {
    const isRunning = status.printableStatus as string === "Running"
    if (!isRunning) {
        return
    }

    const url = `/console?namespace=${namespace}&name=${name}`
    const width = screen.width - 400
    const height = screen.height - 250
    const left = 0
    const top = 0

    window.open(url, `${namespace}/${name}`, `toolbars=0, width=${width}, height=${height}, left=${left}, top=${top}`)
}

const statusEqual = (status: any, target: string) => {
    return status.printableStatus as string === target
}

const actionItemsFunc = (vm: CustomResourceDefinition, notification: NotificationInstance) => {
    const namespace = vm.metadata?.namespace
    const name = vm.metadata?.name
    const status = jsonParse(vm?.status)

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => manageVirtualMachinePowerState(namespace!, name!, VirtualMachinePowerStateRequest_PowerState.ON, notification),
                    label: "启动",
                    disabled: statusEqual(status, "Running")
                },
                {
                    key: 'restart',
                    onClick: () => manageVirtualMachinePowerState(namespace!, name!, VirtualMachinePowerStateRequest_PowerState.REBOOT, notification),
                    label: "重启",
                    disabled: !statusEqual(status, "Running")
                },
                {
                    key: 'stop',
                    onClick: () => manageVirtualMachinePowerState(namespace!, name!, VirtualMachinePowerStateRequest_PowerState.OFF, notification),
                    label: "关机",
                    disabled: statusEqual(status, "Stopped")
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => manageVirtualMachinePowerState(namespace!, name!, VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, notification),
                    label: "强制重启",
                    disabled: !statusEqual(status, "Running")
                },
                {
                    key: 'force-stop',
                    onClick: () => manageVirtualMachinePowerState(namespace!, name!, VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, notification),
                    label: "强制关机",
                    disabled: statusEqual(status, "Stopped")
                },
            ]
        },
        {
            key: 'divider-1',
            type: 'divider'
        },
        {
            key: 'console',
            label: '控制台',
            onClick: () => openConsole(namespace!, name!, status),
            disabled: !statusEqual(status, "Running")
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'bindlabel',
            label: '绑定标签'
        },
        {
            key: 'edit',
            label: "编辑"
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
                    title: "删除虚拟机？",
                    content: `即将删除 "${namespace}/${name}" 虚拟机，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await deleteVirtualMachine(namespace!, name!, notification)
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default columnsFunc
