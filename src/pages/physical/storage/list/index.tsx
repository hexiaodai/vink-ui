import { Flex, Progress, Space } from 'antd'
import { bytesToHumanReadable, getProgressColor, roundToDecimals } from '@/utils/utils'
import { Node } from '@/clients/node'
import { ResourceTable } from '@/components/resource-table'
import { ResourceType } from '@/clients/ts/types/types'
import { getNodeStorages, NodeStorage } from '@/clients/annotation'
import type { ProColumns } from '@ant-design/pro-components'
import DefaultStatus from '@/components/default-status'

export default () => {
    const converDataSource = (data: Node[] | undefined): NodeStorage[] | undefined => {
        const newStorages: NodeStorage[] = []
        for (const node of data ?? []) {
            const storages = getNodeStorages(node)
            if (!storages) continue
            for (const storage of storages) {
                newStorages.push({ ...storage, name: node.metadata?.name })
            }
        }
        return newStorages
    }

    const columns: ProColumns<any>[] = [
        {
            key: 'node',
            title: '节点',
            fixed: 'left',
            ellipsis: true,
            render: (_, storage) => storage.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, storage) => <DefaultStatus ready={storage.up} />
        },
        {
            key: 'storage',
            title: '存储',
            ellipsis: true,
            render: (_, storage) => {
                const total = bytesToHumanReadable(storage.storageTotal)
                const usagePercent = roundToDecimals((storage.storageUsage / storage.storageTotal) * 100, 1)
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
            key: 'device',
            title: 'Device',
            ellipsis: true,
            render: (_, storage) => storage.bluestoreBdevDevNode
        },
        {
            key: 'deviceType',
            title: 'Device Type',
            ellipsis: true,
            render: (_, storage) => storage.bluestoreBdevType
        },
        {
            key: 'osd',
            title: 'OSD',
            ellipsis: true,
            render: (_, storage) => `osd.${storage.osd || 0}`
        }
    ]

    return (
        <ResourceTable<Node>
            tableKey="node-storage-list"
            resourceType={ResourceType.NODE}
            columns={columns}
            converDataSourceFunc={converDataSource}
        />
    )
}
