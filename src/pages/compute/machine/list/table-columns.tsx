import { ProColumns } from "@ant-design/pro-components"
import { Dropdown, MenuProps, Modal, Popover, Flex, Tag } from "antd"
import { formatMemory } from '@/utils/k8s'
import { EllipsisOutlined } from '@ant-design/icons'
import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { formatTimestamp, openConsole } from '@/utils/utils'
import { NotificationInstance } from "antd/es/notification/interface"
import { manageVirtualMachinePowerState } from "@/clients/virtualmachine"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { Link } from "react-router-dom"
import { instances as annotations } from '@/apis/sdks/ts/annotation/annotations.gen'
import { rootDisk, virtualMachine, virtualMachineInstance, virtualMachineIPs } from "@/utils/parse-summary"
import OperatingSystem from "@/components/operating-system"
import VirtualMachineStatus from "@/components/vm-status"
import Terminal from "@/components/terminal"

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
            render: (_, summary) => <VirtualMachineStatus vm={virtualMachine(summary)} />
        },
        {
            key: 'console',
            title: '控制台',
            width: 90,
            render: (_, summary) => <Terminal vm={virtualMachine(summary)} />
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, summary) => {
                return <OperatingSystem rootDataVolume={rootDisk(summary)} />
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
            render: (_, summary) => virtualMachineInstance(summary)?.status?.nodeName
        },
        {
            key: 'nodeIP',
            title: '节点 IP',
            ellipsis: true,
            render: (_, summary) => {
                const vmi = virtualMachineInstance(summary)
                if (!vmi || !vmi.metadata.annotations) {
                    return
                }

                const ipsAnnoVale = vmi.metadata.annotations[annotations.VinkVirtualmachineinstanceHost.name]
                if (!ipsAnnoVale || ipsAnnoVale.length == 0) {
                    return
                }

                const ips = JSON.parse(ipsAnnoVale)
                if (ips.length === 0) {
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

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{ips[0]}</Tag>
                        +{ips.length}
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

export const actionItemsFunc = (vm: any, notification: NotificationInstance) => {
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
