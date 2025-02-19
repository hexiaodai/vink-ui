import { Dropdown, Flex, Progress, Space } from 'antd'
import { useState } from 'react'
import { EllipsisOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { bytesToHumanReadable, calculateAge, getProgressColor, roundToDecimals } from '@/utils/utils'
import { Node } from '@/clients/node'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { NodeResourceMetrics } from '@/clients/ts/types/node'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { MenuProps } from 'antd/lib'
import type { ProColumns } from '@ant-design/pro-components'
import DefaultStatus from '@/components/default-status'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: "status.addresses[*].address", label: "IP 地址", operator: "*=" }
]

export default () => {
    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<Node>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, node) => {
                return <Link to={{
                    pathname: "/physical/machines/monitor",
                    search: `name=${node.metadata.name}`
                }}>
                    {node.metadata.name}
                </Link>
            }
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, node) => <DefaultStatus crd={node} />
        },
        {
            key: 'ip',
            title: 'IP',
            ellipsis: true,
            render: (_, node) => {
                if (node.status?.addresses) {
                    const hostIP = node.status.addresses.find(address => address.type === "InternalIP")
                    if (hostIP) {
                        return hostIP.address
                    }
                }
            }
        },
        {
            key: 'cpu',
            title: 'CPU',
            ellipsis: true,
            render: (_, node) => {
                const metricsString = node.metadata?.annotations?.[annotations.VinkMonitor.name]
                if (!metricsString) {
                    return
                }
                const metrics = JSON.parse(metricsString) as NodeResourceMetrics
                const cpuUsage = roundToDecimals(metrics.cpuUsage * 100, 1)
                const cpuTotal = roundToDecimals(metrics.cpuTotal, 1)

                return (
                    <Space style={{ display: "block" }} size="small">
                        <Flex justify="space-between" align="center">
                            <span>{cpuUsage}%</span>
                            <span>{cpuTotal} C</span>
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
            render: (_, node) => {
                const metricsString = node.metadata?.annotations?.[annotations.VinkMonitor.name]
                if (!metricsString) {
                    return
                }
                const metrics = JSON.parse(metricsString) as NodeResourceMetrics
                const memeryUsage = roundToDecimals(metrics.memeryUsage * 100, 1)
                const memeryTotal = roundToDecimals(metrics.memeryTotal, 1)
                return (
                    <Space style={{ display: "block" }} size="small">
                        <Flex justify="space-between" align="center">
                            <span>{memeryUsage}%</span>
                            <span>{memeryTotal} GB</span>
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
            key: 'storage',
            title: '存储',
            ellipsis: true,
            render: (_, node) => {
                const metricsString = node.metadata?.annotations?.[annotations.VinkMonitor.name]
                if (!metricsString) {
                    return
                }
                const metrics = JSON.parse(metricsString) as NodeResourceMetrics
                const total = bytesToHumanReadable(metrics.storageTotal)
                const usagePercent = roundToDecimals((metrics.storageUsage / metrics.storageTotal) * 100, 1)
                return (
                    <Space style={{ display: "block" }} size="small">
                        <Flex justify="space-between" align="center">
                            <span>{usagePercent}%</span>
                            <span>{total}</span>
                        </Flex>
                        <Progress
                            percent={usagePercent}
                            showInfo={false}
                            size={{ height: 4 }}
                            strokeColor={getProgressColor(usagePercent)}
                        />
                    </Space>
                )
            }
        },
        {
            key: 'age',
            title: 'Age',
            width: 90,
            ellipsis: true,
            render: (_, node) => calculateAge(node.metadata.creationTimestamp!)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, node) => {
                const nn = { namespace: node.metadata!.namespace!, name: node.metadata!.name }
                const items: MenuProps['items'] = [
                    {
                        key: 'yaml',
                        label: 'YAML',
                        onClick: () => setYamlDetail({ open: true, nn: nn })
                    }
                ]
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined />
                    </Dropdown>
                )
            }
        }
    ]

    const close = () => {
        setYamlDetail({ open: false, nn: undefined })
    }

    return (
        <>
            <ResourceTable<Node>
                tableKey="node-list"
                resourceType={ResourceType.NODE}
                searchOptions={searchOptions}
                columns={columns}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.NODE}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
