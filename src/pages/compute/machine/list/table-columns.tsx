import { ProColumns } from "@ant-design/pro-components"
import { Popover, Flex, Tag } from "antd"
import { formatMemory } from '@/utils/k8s'
import { formatTimestamp } from '@/utils/utils'
import { Link } from "react-router-dom"
import { instances as annotations } from '@/apis/sdks/ts/annotation/annotations.gen'
import { rootDisk, virtualMachine, virtualMachineInstance, virtualMachineIPs } from "@/utils/parse-summary"
import OperatingSystem from "@/components/operating-system"
import Terminal from "@/components/terminal"
import VirtualMachineManagement from "@/pages/compute/machine/components/management"
import VirtualMachineStatus from "@/pages/compute/machine/components/status"

const columnsFunc = () => {
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
            render: (_, summary) => <VirtualMachineManagement type="list" namespace={{ namespace: summary.metadata.namespace, name: summary.metadata.name }} />
        }
    ]
    return columns
}

export default columnsFunc
