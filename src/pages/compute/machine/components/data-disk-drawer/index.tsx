import { Button, Drawer, Flex, MenuProps, Space } from 'antd'
import { useEffect, useState } from 'react'
import { formatMemoryString } from '@/utils/k8s'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { ResourceType } from '@/clients/ts/types/types'
import { useWatchResources } from '@/hooks/use-resource'
import { getNamespaceFieldSelector, replaceDots, simpleFieldSelector } from '@/utils/search'
import { useNamespaceFromURL } from '@/hooks/use-namespace-from-url'
import { CustomTable } from '@/components/custom-table'
import { dataSource } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import type { ProColumns } from '@ant-design/pro-components'

interface DataDiskDrawerProps {
    open?: boolean
    current?: any[]
    onCanel?: () => void
    onConfirm?: (dataDisks: any[]) => void
}

export const DataDiskDrawer: React.FC<DataDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const namespaceName = useNamespaceFromURL()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    useEffect(() => {
        setSelectedRows(current || [])
    }, [open])

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelector: simpleFieldSelector([
            getNamespaceFieldSelector(namespaceName.namespace),
            { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", value: "data" }
        ])
    }))

    const { resources, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts, !open)

    const handleCheckboxProps = (dv: any) => {
        const binding = dv.metadata.annotations[annotations.VinkVirtualmachineBinding.name]
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
                searchOptions={searchOptions}
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

const searchOptions: MenuProps['items'] = [
    { key: 'metadata.name*=', label: "Name" }
]

const columns: ProColumns<any>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata.name
    },
    {
        key: 'binding',
        title: '资源占用',
        ellipsis: true,
        render: (_, dv) => {
            const binding = dv.metadata?.annotations[annotations.VinkVirtualmachineBinding.name]
            if (!binding) {
                return "空闲"
            }
            const parse = JSON.parse(binding)
            return parse && parse.length > 0 ? "使用中" : "空闲"
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
