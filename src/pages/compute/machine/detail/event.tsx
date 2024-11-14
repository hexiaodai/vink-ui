import { ResourceType } from "@/clients/ts/types/resource"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { capacity, dataSource, getErrorMessage } from "@/utils/utils"
import { App, Badge, Modal, Space, Table, TableProps } from "antd"
import { instances as labels } from '@/clients/ts/label/labels.gen'
import { useWatchResources } from "@/hooks/use-resource"
import { LoadingOutlined, StopOutlined } from '@ant-design/icons'
import { dataVolumes, virtualMachine } from "@/utils/parse-summary"
import { clients, emptyOptions, getResourceName } from "@/clients/clients"
import { NotificationInstance } from "antd/es/notification/interface"
import { extractNamespaceAndName, namespaceNameKey } from "@/utils/k8s"
import commonStyles from "@/common/styles/common.module.less"
import { useEffect, useRef } from "react"
import { ListOptions } from "@/clients/ts/types/list_options"
import { useNamespace } from "@/common/context"
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"

export default () => {
    const { notification } = App.useApp()

    const namespaceName = useNamespaceFromURL()

    const namespaceNameSelector = `involvedObject.namespace=${namespaceName.namespace},involvedObject.name=${namespaceName.name}`
    const optsRef = useRef<ListOptions>(emptyOptions({
        customSelector: {
            fieldSelector: [
                `involvedObject.kind=VirtualMachine,${namespaceNameSelector}`,
                `involvedObject.kind=VirtualMachineInstance,${namespaceNameSelector}`,
                `involvedObject.kind=Pod,${namespaceNameSelector}`
            ],
            namespaceNames: []
        }
    }))
    const { resources: events, loading } = useWatchResources(ResourceType.EVENT, optsRef.current)

    console.log(events)

    return (
        <Table
            size="middle"
            loading={{ spinning: loading, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={dataSource(events)}
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
        render: (_, e) => e.type
    },
    {
        title: 'source',
        key: 'source',
        ellipsis: true,
        render: (_, e) => e.source.component
    },
    {
        title: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (_, e) => e.reason
    },
    {
        title: 'message',
        key: 'message',
        ellipsis: true,
        render: (_, e) => e.message
    },
    {
        title: 'lastTimestamp',
        key: 'lastTimestamp',
        ellipsis: true,
        render: (_, e) => e.lastTimestamp
    }
]
