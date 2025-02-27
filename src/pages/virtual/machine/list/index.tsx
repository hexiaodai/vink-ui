import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Popover, Progress, Space, Tag } from 'antd'
import { Link, NavLink } from 'react-router-dom'
import { calculateResourceAge, getProgressColor, roundToDecimals } from '@/utils/utils'
import { ResourceType } from '@/clients/ts/types/types'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { VirtualMachine } from '@/clients/virtual-machine'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { annotationSelector } from '@/utils/search'
import { getNamespaceName } from '@/utils/k8s'
import { getHost, getNetworks, getVirtualMachineMonitor } from '@/clients/annotation'
import type { ProColumns } from '@ant-design/pro-components'
import VirtualMachineStatus from '../components/virtual-machine-status'
import Terminal from '@/components/terminal'
import OperatingSystem from '@/components/operating-system'
import VirtualMachineManagement from '../components/management'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: annotationSelector(annotations.VinkNetworks.name), label: "IP 地址", operator: "*=" },
    { fieldPath: annotationSelector(annotations.VinkHost.name), label: "物理机名称", operator: "*=" },
    { fieldPath: annotationSelector(annotations.VinkHost.name), label: "物理机 IP 地址", operator: "*=" }
]

const columns: ProColumns<VirtualMachine>[] = [
    {
        key: 'name',
        title: '名称',
        fixed: 'left',
        ellipsis: true,
        render: (_, vm) => {
            return <Link to={{
                pathname: "/virtual/machines/detail",
                search: `namespace=${vm.metadata!.namespace}&name=${vm.metadata!.name}`
            }}>
                {vm.metadata!.name}
            </Link>
        }
    },
    {
        key: 'status',
        title: '状态',
        ellipsis: true,
        render: (_, vm) => <VirtualMachineStatus vm={vm} />
    },
    {
        key: 'operatingSystem',
        title: '操作系统',
        ellipsis: true,
        render: (_, vm) => <OperatingSystem vm={vm} />
    },
    {
        key: 'cpu',
        title: 'CPU',
        ellipsis: true,
        render: (_, vm) => {
            const metrics = getVirtualMachineMonitor(vm)
            if (!metrics) return

            const cores = vm.spec.template.spec?.domain.cpu?.cores || 0
            const cpuUsage = roundToDecimals(metrics.cpuUsage * 100 / cores, 1)

            return (
                <Space style={{ display: "block" }} size="small">
                    <Flex justify="space-between" align="center">
                        <span>{cpuUsage}%</span>
                        <span>{cores} C</span>
                    </Flex>
                    <Progress
                        percent={cpuUsage}
                        showInfo={false}
                        size={{ height: 4 }}
                        strokeColor={getProgressColor(cpuUsage)}
                    />
                </Space>
            )
        }
    },
    {
        key: 'memery',
        title: '内存',
        ellipsis: true,
        render: (_, vm) => {
            const metrics = getVirtualMachineMonitor(vm)
            if (!metrics) return

            const memeryUsage = roundToDecimals(metrics.memeryUsage * 100, 1)
            return (
                <Space style={{ display: "block" }} size="small">
                    <Flex justify="space-between" align="center">
                        <span>{memeryUsage}%</span>
                        <span>{vm.spec.template.spec?.domain.memory?.guest} GB</span>
                    </Flex>
                    <Progress
                        percent={memeryUsage}
                        showInfo={false}
                        size={{ height: 4 }}
                        strokeColor={getProgressColor(memeryUsage)}
                    />
                </Space>
            )
        }
    },
    {
        key: 'ipv4',
        title: 'IPv4',
        ellipsis: true,
        render: (_, vm) => {
            const addrs: string[] = []
            for (const network of getNetworks(vm)) {
                addrs.push(network.ip)
            }
            if (addrs.length === 0) {
                return
            }

            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {addrs.map((element, index) => (
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
        key: 'node',
        title: '节点',
        ellipsis: true,
        render: (_, vm) => {
            return getHost(vm)?.name
        }
    },
    {
        key: 'nodeIP',
        title: '节点 IP',
        ellipsis: true,
        render: (_, vm) => {
            const host = getHost(vm)
            if (!host || host.ips.length === 0) {
                return
            }
            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {host.ips.map((element: any, index: any) => (
                        <Tag key={index} bordered={true}>
                            {element}
                        </Tag>
                    ))}
                </Flex>
            )

            return (
                <Popover content={content}>
                    <Tag bordered={true}>{host.ips[0]}</Tag>
                    +{host.ips.length}
                </Popover>
            )
        }
    },
    {
        key: 'console',
        title: '控制台',
        width: 90,
        render: (_, vm) => <Terminal vm={vm} />
    },
    {
        key: 'age',
        title: 'Age',
        ellipsis: true,
        width: 90,
        render: (_, vm) => calculateResourceAge(vm)
    },
    {
        key: 'action',
        title: '操作',
        fixed: 'right',
        width: 90,
        align: 'center',
        render: (_, vm) => <VirtualMachineManagement type="list" nn={getNamespaceName(vm)} />
    }
]

export default () => {
    return (
        <ResourceTable<VirtualMachine>
            tableKey="virtual-machine-list"
            resourceType={ResourceType.VIRTUAL_MACHINE}
            searchOptions={searchOptions}
            columns={columns}
            toolbar={{
                actions: [
                    <NavLink to='/virtual/machines/create'><Button icon={<PlusOutlined />}>创建虚拟机</Button></NavLink>
                ]
            }}
        />
    )
}
