import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal, Popover, Badge, Flex, Tag } from "antd"
import { formatMemory } from '@/utils/k8s'
import { CodeOutlined, EllipsisOutlined } from '@ant-design/icons'
import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { formatTimestamp, openConsole } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { virtualMachineStatusMap } from "@/utils/resource-status"
import { manageVirtualMachinePowerState } from "@/clients/virtualmachine"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { Link } from "react-router-dom"
import { rootDisk, virtualMachine, virtualMachineHost, virtualMachineIPs } from "@/utils/parse-summary"
import TableColumnOperatingSystem from "@/components/table-column/operating-system"
import commonStyles from '@/common/styles/common.module.less'

const columnsFunc = (notification: NotificationInstance) => {
    const columns: ProColumns<any>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, summary) => <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${summary.metadata?.namespace}&name=${summary.metadata?.name}` }}>{summary.metadata?.name}</Link>,
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, summary) => {
                const vm = virtualMachine(summary)
                return <Badge status={virtualMachineStatusMap[vm.status.printableStatus].badge} text={virtualMachineStatusMap[vm.status.printableStatus].text} />
            }
        },
        {
            key: 'console',
            title: '控制台',
            width: 90,
            render: (_, summary) => {
                const vm = virtualMachine(summary)
                const isRunning = vm.status?.printableStatus as string === "Running"

                return (
                    <a href='#'
                        className={isRunning ? "" : commonStyles["a-disable"]}
                        onClick={() => { openConsole(vm) }}
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
            render: (_, summary) => {
                return <TableColumnOperatingSystem rootDataVolume={rootDisk(summary)} />
            }
        },
        {
            key: 'ipv4',
            title: 'IPv4',
            ellipsis: true,
            render: (_, summary) => {
                const ipObjs = virtualMachineIPs(summary)
                if (!ipObjs) {
                    return
                }

                const addrs: string[] = []
                for (const ipObj of ipObjs) {
                    addrs.push(ipObj.spec.ipAddress)
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {addrs.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{addrs[0]}</Tag>
                        +{addrs.length}
                    </Popover>
                )
            }
        },
        {
            key: 'cpu',
            title: '处理器',
            ellipsis: true,
            render: (_, summary) => {
                const vm = virtualMachine(summary)
                let core = vm.spec.template?.spec?.domain?.cpu?.cores || vm.spec.template?.spec?.resources?.requests?.cpu
                return core ? `${core} Core` : ''
            }
        },
        {
            key: 'memory',
            title: '内存',
            ellipsis: true,
            render: (_, summary) => {
                const vm = virtualMachine(summary)
                const mem = vm.spec.template?.spec?.domain?.memory?.guest || vm.spec.template?.spec?.domain?.resources?.requests?.memory
                const [value, unit] = formatMemory(mem)
                return `${value} ${unit}`
            }
        },
        {
            key: 'node',
            title: '节点',
            ellipsis: true,
            render: (_, summary) => {
                const host = virtualMachineHost(summary)
                return host?.metadata.name
            }
        },
        {
            key: 'nodeIP',
            title: '节点 IP',
            ellipsis: true,
            render: (_, summary) => {
                const host = virtualMachineHost(summary)
                const interfaces = host?.status.addresses
                if (!interfaces || interfaces.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {interfaces.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element.address}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{interfaces[0].address}</Tag>
                        +{interfaces.length}
                    </Popover>
                )
            }
        },
        {
            key: 'created',
            title: '创建时间',
            width: 160,
            ellipsis: true,
            render: (_, summary) => formatTimestamp(summary.metadata?.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, summary) => {
                const items = actionItemsFunc(virtualMachine(summary), notification)
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

const statusEqual = (status: any, target: string) => {
    return status.printableStatus as string === target
}

const actionItemsFunc = (vm: any, notification: NotificationInstance) => {
    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => manageVirtualMachinePowerState(vm.metadata.namespace, vm.metadata.name, VirtualMachinePowerStateRequest_PowerState.ON, notification),
                    label: "启动",
                    disabled: statusEqual(vm.status, "Running")
                },
                {
                    key: 'restart',
                    onClick: () => manageVirtualMachinePowerState(vm.metadata.namespace, vm.metadata.name, VirtualMachinePowerStateRequest_PowerState.REBOOT, notification),
                    label: "重启",
                    disabled: !statusEqual(vm.status, "Running")
                },
                {
                    key: 'stop',
                    onClick: () => manageVirtualMachinePowerState(vm.metadata.namespace, vm.metadata.name, VirtualMachinePowerStateRequest_PowerState.OFF, notification),
                    label: "关机",
                    disabled: statusEqual(vm.status, "Stopped")
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => manageVirtualMachinePowerState(vm.metadata.namespace, vm.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, notification),
                    label: "强制重启",
                    disabled: !statusEqual(vm.status, "Running")
                },
                {
                    key: 'force-stop',
                    onClick: () => manageVirtualMachinePowerState(vm.metadata.namespace, vm.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, notification),
                    label: "强制关机",
                    disabled: statusEqual(vm.status, "Stopped")
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
            onClick: () => openConsole(vm),
            disabled: !statusEqual(vm.status, "Running")
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
                    content: `即将删除 "${vm.metadata.namespace}/${vm.metadata.name}" 虚拟机，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm.metadata.namespace, vm.metadata.name, { notification: notification })
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default columnsFunc
