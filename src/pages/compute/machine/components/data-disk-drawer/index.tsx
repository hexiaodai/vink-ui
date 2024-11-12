import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemoryString, namespaceNameKey } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { instances as annotations } from "@/apis/sdks/ts/annotation/annotations.gen"
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { ResourceType } from '@/apis/types/group_version'
import { useListResources } from '@/hooks/use-resource'
import { fieldSelector } from '@/utils/search'
import { useNamespaceFromURL } from '@/hooks/use-namespace-from-url'
import { ListOptions } from '@/apis/types/list_options'
import { emptyOptions } from '@/clients/clients'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import React from 'react'
import tableStyles from '@/common/styles/table.module.less'

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

    const actionRef = useRef<ActionType>()

    const [opts, setOpts] = useState<ListOptions>(emptyOptions({
        namespace: namespaceName.namespace, labelSelector: `${labels.VinkDatavolumeType.name}=data`
    }))

    useEffect(() => {
        if (!open) {
            return
        }
        setOpts(prev => ({ ...prev, namespace: namespaceName.namespace }))
    }, [namespaceName.namespace, open])

    const { resources: dataDisks } = useListResources(ResourceType.DATA_VOLUME, opts)

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
            <ProTable<any, Params>
                className={tableStyles["table-padding"]}
                rowSelection={{
                    selectedRowKeys: selectedRows.map(dv => namespaceNameKey(dv)),
                    onChange: (_, selectedRows) => { setSelectedRows(selectedRows) },
                    getCheckboxProps: handleCheckboxProps
                }}
                columns={dataDiskDrawerColumns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={dataDisks}
                request={async (params) => {
                    setOpts({
                        ...opts, ...(fieldSelector(params) && { fieldSelector: fieldSelector(params) })
                    })
                    return { success: true }
                }}
                rowKey={(vm) => namespaceNameKey(vm)}
                search={false}
                options={{
                    setting: false,
                    density: false,
                    search: {
                        allowClear: true,
                        style: { width: 280 },
                        addonBefore: <Select defaultValue="metadata.name" options={[
                            { value: 'metadata.name', label: '名称' }
                        ]} />
                    }
                }}
                pagination={false}
            />
        </Drawer>
    )
}

const dataDiskDrawerColumns: ProColumns<any>[] = [
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
