import { ResourceType } from "@/clients/ts/types/types"
import { dataSource, formatTimestamp } from "@/utils/utils"
import { Popover, Table, TableProps } from "antd"
import { useWatchResources } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { useRef } from "react"
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import { namespaceNameKey } from "@/utils/k8s"
import { WatchOptions } from "@/clients/ts/management/resource/v1alpha1/watch"

export default () => {
    const namespaceName = useNamespaceFromURL()

    const namespaceSelector = `involvedObject.namespace=${namespaceName.namespace}`
    const nameSelector = `involvedObject.name=${namespaceName.name}`
    const namePrefixSelector = `involvedObject.name^=virt-launcher-${namespaceName.name}-`
    const optsRef = useRef<WatchOptions>(WatchOptions.create({
        fieldSelector: [
            `involvedObject.kind=VirtualMachine,${namespaceSelector},${nameSelector}`,
            `involvedObject.kind=VirtualMachineInstance,${namespaceSelector},${nameSelector}`,
            `involvedObject.kind=Pod,${namespaceSelector},${namePrefixSelector}`
        ]
    }))
    const { resources: events, loading } = useWatchResources(ResourceType.EVENT, optsRef.current)

    const sort = () => {
        const items = dataSource(events)
        if (!items) {
            return undefined
        }
        return items.sort((a: any, b: any) => {
            return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
        })
    }

    return (
        <Table
            size="middle"
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={sort()}
            rowKey={(e) => namespaceNameKey(e)}
            pagination={false}
        />
    )
}

const columns: TableProps<any>['columns'] = [
    {
        title: 'type',
        key: 'type',
        ellipsis: true,
        width: 100,
        render: (_, e) => e.type
    },
    {
        title: 'source',
        key: 'source',
        ellipsis: true,
        width: 150,
        render: (_, e) => e.source.component
    },
    {
        title: 'reason',
        key: 'reason',
        ellipsis: true,
        width: 150,
        render: (_, e) => e.reason
    },
    {
        title: 'message',
        key: 'message',
        ellipsis: true,
        render: (_, e) => <Popover content={<div style={{ maxWidth: 300 }}>{e.message}</div>}>{e.message}</Popover>
    },
    {
        title: 'lastTimestamp',
        key: 'lastTimestamp',
        ellipsis: true,
        width: 160,
        render: (_, e) => formatTimestamp(e.lastTimestamp)
    }
]
