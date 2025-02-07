import { App, Progress } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateAge } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { Node, watchNodes } from '@/clients/node'
import type { ProColumns } from '@ant-design/pro-components'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" }
]

const columns: ProColumns<Node>[] = [
    {
        key: 'name',
        title: '名称',
        fixed: 'left',
        ellipsis: true,
        render: (_, node) => {
            return <Link to={{
                pathname: "/compute/hosts/monitor",
                search: `name=${node.metadata.name}`
            }}>
                {node.metadata.name}
            </Link>
        }
    },
    {
        key: 'status',
        title: 'Status',
        ellipsis: true,
        render: (_, node) => {
            const ready = node.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True'
            return ready ? 'Ready' : 'NotReady'
        }
    },
    {
        key: 'hostIP',
        title: 'Host IP',
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
        width: 160,
        render: (_, node: Node) => {
            const capacityCpu = node.status?.capacity?.cpu?.endsWith('m')
                ? parseInt(node.status.capacity.cpu, 10)
                : parseInt(node.status?.capacity?.cpu || "0", 10) * 1000
            const allocatableCpu = node.status?.allocatable?.cpu?.endsWith('m')
                ? parseInt(node.status.allocatable.cpu, 10)
                : parseInt(node.status?.allocatable?.cpu || "0", 10) * 1000
            const cpuPercent = Math.round(allocatableCpu / capacityCpu * 100 || 0)
            return <Progress percent={cpuPercent} percentPosition={{ align: 'center', type: 'inner' }} size={[150, 15]} />
        }
    },
    {
        key: 'memery',
        title: 'Memery',
        ellipsis: true,
        width: 160,
        render: (_, node: Node) => {
            const convertToBytes = (value: string) => {
                if (value.endsWith('Gi')) return parseFloat(value) * 1024 ** 3;
                if (value.endsWith('Mi')) return parseFloat(value) * 1024 ** 2;
                if (value.endsWith('Ki')) return parseFloat(value) * 1024;
                return parseInt(value, 10)
            }

            const capacityMemory = convertToBytes(node.status?.capacity?.memory || "0")
            const allocatableMemory = convertToBytes(node.status?.allocatable?.memory || "0")
            const memoryPercent = Math.round(allocatableMemory / capacityMemory * 100 || 0)
            return <Progress percent={memoryPercent} percentPosition={{ align: 'center', type: 'inner' }} size={[150, 15]} />
        }
    },
    {
        key: 'age',
        title: 'Age',
        ellipsis: true,
        render: (_, node) => calculateAge(node.metadata.creationTimestamp)
    }
]

export default () => {
    const { notification } = App.useApp()

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create())

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<Node[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchNodes(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    return (
        <CustomTable<Node>
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            tableKey="node-list-table-columns"
            columns={columns}
            dataSource={resources}
        />
    )
}
