import { TableProps } from "antd"
import { capacity } from "@/utils/utils"
import { formatMemoryString, namespaceNameKey } from "@/utils/k8s"
import { ProColumns } from "@ant-design/pro-components"
import { NetworkConfig } from "../vm"
import OperatingSystem from "@/components/operating-system"

export const getDataDiskColumns = (dataDisks: any[], setDataDisks: any) => {
    const dataDiskColumns: TableProps<any>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => dv.metadata?.name
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes[0]
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => capacity(dv)
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (<a onClick={() => {
                const newDisks = dataDisks.filter(item => !(namespaceNameKey(item.metadata) === namespaceNameKey(dv.metadata)))
                setDataDisks(newDisks)
            }}>移除</a>)
        }
    ]
    return dataDiskColumns
}

export const getNetworkColumns = (networks: NetworkConfig[], setNetworks: any) => {
    const networkColumns: TableProps<NetworkConfig>['columns'] = [
        {
            title: 'Network',
            key: 'network',
            ellipsis: true,
            render: (_, cfg) => cfg.network
        },
        {
            title: 'Interface',
            key: 'interface',
            ellipsis: true,
            render: (_, cfg) => cfg.interface
        },
        {
            title: '默认网络',
            key: 'default',
            ellipsis: true,
            render: (_, cfg) => cfg.default ? "是" : "否"
        },
        {
            title: 'Multus CR',
            key: 'multusCR',
            ellipsis: true,
            render: (_, cfg) => namespaceNameKey(cfg.multus)
        },
        {
            title: 'VPC',
            key: 'vpc',
            ellipsis: true,
            render: (_, cfg) => cfg.subnet?.spec.vpc
        },
        {
            title: '子网',
            key: 'subnet',
            ellipsis: true,
            render: (_, cfg) => cfg.subnet?.metadata.name
        },
        {
            title: 'IP 地址池',
            key: 'ippool',
            ellipsis: true,
            render: (_, cfg) => cfg.ippool?.metadata.name || "自动分配"
        },
        {
            title: 'IP 地址',
            key: 'ipAddress',
            ellipsis: true,
            render: (_, cfg) => cfg.ipAddress || "自动分配"
        },
        {
            title: 'MAC 地址',
            key: 'macAddress',
            ellipsis: true,
            render: (_, cfg) => cfg.macAddress || "自动分配"
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, cfg) => (<a onClick={() => {
                const newNetworks = networks.filter(item => item.multus !== cfg.multus)
                setNetworks(newNetworks)
            }}>移除</a>)
        }
    ]
    return networkColumns
}

export const rootDiskDrawerColumns: ProColumns<any>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata?.name
    },
    {
        title: '操作系统',
        key: 'operatingSystem',
        ellipsis: true,
        render: (_, dv) => <OperatingSystem rootDataVolume={dv} />
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => formatMemoryString(dv.spec.pvc?.resources?.requests?.storage)
    }
]
