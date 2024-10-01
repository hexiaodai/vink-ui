import { TableProps } from "antd"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { capacity, parseSpec } from "@/utils/utils"
import { formatMemoryString, namespaceName } from "@/utils/k8s"
import { NetworkConfig } from "./network-drawer"
import { ProColumns } from "@ant-design/pro-components"
import { instances as annotations } from "@/apis/sdks/ts/annotation/annotations.gen"
import TableColumnOperatingSystem from "@/components/table-column/operating-system"

export const getDataDiskColumns = (dataDisks: CustomResourceDefinition[], setDataDisks: any) => {
    const dataDiskColumns: TableProps<CustomResourceDefinition>['columns'] = [
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
            render: (_, dv) => parseSpec(dv).pvc?.storageClassName
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => parseSpec(dv).pvc?.accessModes[0]
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
                const newDisks = dataDisks.filter(item => !(namespaceName(item.metadata) === namespaceName(dv.metadata)))
                setDataDisks(newDisks)
            }}>移除</a>)
        }
    ]
    return dataDiskColumns
}

export const getNetworkColumns = (networks: NetworkConfig[], setNetworks: any) => {
    const networkColumns: TableProps<NetworkConfig>['columns'] = [
        {
            title: '网络模式',
            key: 'networkMode',
            ellipsis: true,
            render: (_, cfg) => cfg.networkMode
        },
        {
            title: 'Multus CR',
            key: 'multusCR',
            ellipsis: true,
            render: (_, cfg) => cfg.multusCR.metadata?.name
        },
        {
            title: 'VPC',
            key: 'vpc',
            ellipsis: true,
            render: (_, cfg) => parseSpec(cfg.subnet).vpc
        },
        {
            title: '子网',
            key: 'subnet',
            ellipsis: true,
            render: (_, cfg) => cfg.subnet.metadata?.name
        },
        {
            title: 'IP 地址池',
            key: 'ippool',
            ellipsis: true,
            render: (_, cfg) => cfg.ippool?.metadata?.name || "自动分配"
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
                const newNetworks = networks.filter(item => item.multusCR.metadata?.name !== cfg.multusCR.metadata?.name)
                setNetworks(newNetworks)
            }}>移除</a>)
        }
    ]
    return networkColumns
}

export const rootDiskDrawerColumns: ProColumns<CustomResourceDefinition>[] = [
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
        render: (_, dv) => <TableColumnOperatingSystem rootDataVolume={dv} />
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => formatMemoryString(parseSpec(dv).pvc?.resources?.requests?.storage)
    }
]

export const dataDiskDrawerColumns: ProColumns<CustomResourceDefinition>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata?.name
    },
    {
        key: 'binding',
        title: '资源占用',
        ellipsis: true,
        render: (_, dv) => {
            const binding = dv.metadata?.annotations[annotations.VinkVirtualmachineBinding.name]
            return binding && binding.length > 0 ? "使用中" : "空闲"
        }
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => formatMemoryString(parseSpec(dv).pvc?.resources?.requests?.storage)
    },
    {
        title: '存储类',
        key: 'storageClassName',
        ellipsis: true,
        render: (_, dv) => parseSpec(dv).pvc?.storageClassName
    },
    {
        title: '访问模式',
        key: 'accessModes',
        ellipsis: true,
        render: (_, dv) => parseSpec(dv).pvc?.accessModes[0]
    }
]
