import { Badge, Button, Drawer, Flex, Popover, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { formatMemoryString } from '@/utils/k8s'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { useWatchResources } from '@/hooks/use-resource'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { useNamespaceFromURL } from '@/hooks/use-namespace-from-url'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { dataSource, filterNullish } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { dataVolumeStatusMap } from '@/utils/resource-status'
import type { ProColumns } from '@ant-design/pro-components'

interface DataDiskDrawerProps {
    open?: boolean
    current?: any[]
    onCanel?: () => void
    onConfirm?: (dataDisks: any[]) => void
}

const dvTypeSelector: FieldSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["data"] }

export const DataDiskDrawer: React.FC<DataDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const namespaceName = useNamespaceFromURL()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    useEffect(() => {
        setSelectedRows(current || [])
    }, [open])

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespaceName.namespace), dvTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespaceName.namespace), dvTypeSelector]))
    }, [namespaceName.namespace])

    const { resources, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts, !open)

    const handleCheckboxProps = (dv: any) => {
        const binding = dv.metadata.annotations[annotations.VinkDatavolumeOwner.name]
        if (!binding || binding.length == 0) {
            return { disabled: false }
        }
        const parse = JSON.parse(binding)
        return { disabled: parse && parse.length > 0 }
    }

    return (
        <Drawer
            title="添加磁盘"
            open={open}
            onClose={onCanel}
            closeIcon={false}
            width={650}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={() => {
                            if (selectedRows.length == 0 || !onConfirm) {
                                return
                            }
                            onConfirm(selectedRows)
                        }
                        } type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text' onClick={() => setSelectedRows([])}>重置</Button>
                </Flex>
            }
        >
            <CustomTable
                loading={loading}
                storageKey="data-disk-drawer-table-columns"
                defaultFieldSelectors={defaultFieldSelectors}
                searchItems={searchItems}
                columns={columns}
                updateWatchOptions={setOpts}
                dataSource={dataSource(resources)}
                rowSelection={{
                    onChange: (_, selectedRows) => { setSelectedRows(selectedRows) },
                    getCheckboxProps: handleCheckboxProps
                }}
                tableAlertOptionRender={() => <></>}
            />
        </Drawer>
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.phase", name: "Status",
        items: [
            { inputValue: "Succeeded", values: ["Succeeded"], operator: '=' },
            { inputValue: "Failed", values: ["Failed"], operator: '=' },
            { inputValue: 'Provisioning', values: ["ImportInProgress", "CloneInProgress", "CloneFromSnapshotSourceInProgress", "SmartClonePVCInProgress", "CSICloneInProgress", "ExpansionInProgress", "NamespaceTransferInProgress", "PrepClaimInProgress", "RebindInProgress"], operator: '~=' },
        ]
    }
]

const columns: ProColumns<any>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata.name
    },
    {
        key: 'status',
        title: '状态',
        ellipsis: true,
        render: (_, dv) => {
            const displayStatus = parseFloat(dv.status.progress) === 100 ? dataVolumeStatusMap[dv.status.phase].text : dv.status.progress
            return <Badge status={dataVolumeStatusMap[dv.status.phase].badge} text={displayStatus} />
        }
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => {
            const storage = dv.spec.pvc?.resources?.requests?.storage
            if (!storage) {
                return
            }
            return formatMemoryString(storage)
        }
    },
    // {
    //     key: 'binding',
    //     title: '资源占用',
    //     ellipsis: true,
    //     render: (_, dv) => {
    //         const binding = dv.metadata?.annotations[annotations.VinkDatavolumeOwner.name]
    //         if (!binding) {
    //             return "空闲"
    //         }
    //         const parse = JSON.parse(binding)
    //         return parse && parse.length > 0 ? "使用中" : "空闲"
    //     }
    // },
    {
        key: 'owner',
        title: 'Owner',
        ellipsis: true,
        render: (_, dv) => {
            const owners = dv.metadata.annotations[annotations.VinkDatavolumeOwner.name]
            if (!owners) {
                return
            }
            const parse: string[] = JSON.parse(owners)

            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {parse.map((element: any, index: any) => (
                        <Tag key={index} bordered={true}>
                            {element}
                        </Tag>
                    ))}
                </Flex>
            )

            return (
                <Popover content={content}>
                    <Tag bordered={true}>{parse[0]}</Tag>
                    +{parse.length}
                </Popover>
            )
        }
    },
    {
        title: '存储类',
        key: 'storageClassName',
        ellipsis: true,
        render: (_, dv) => dv.spec.pvc?.storageClassName
    },
    {
        title: '访问模式',
        key: 'accessModes',
        ellipsis: true,
        render: (_, dv) => {
            if (dv.spec.pvc?.accessModes.length == 0) {
                return
            }
            return dv.spec.pvc.accessModes[0]
        }
    }
]
