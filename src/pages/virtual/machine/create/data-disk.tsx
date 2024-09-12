import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemory, namespaceName } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { jsonParse } from '@/utils/utils'
import { updateDataDisks } from './resource-manager'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import TableStyles from '@/common/styles/table.module.less'
import React from 'react'

interface DataDiskProps {
    open?: boolean
    namespace?: string
    current?: CustomResourceDefinition[]
    onCanel?: () => void
    onConfirm?: (dataDisks: CustomResourceDefinition[]) => void
}

const columns: ProColumns<CustomResourceDefinition>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => (<>{dv.metadata?.name}</>)
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => {
            const spec = jsonParse(dv.spec)
            const [value, uint] = formatMemory(spec.pvc?.resources?.requests?.storage)
            return `${value} ${uint}`
        }
    },
    {
        title: '描述',
        key: 'description',
        ellipsis: true,
        render: (_, dv) => `${dv.metadata?.annotations?.description || ""}`
    },
]

export const DataDisk: React.FC<DataDiskProps> = ({ open, current, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const [searchFilter, setSearchFilter] = useState<string>("name")
    const [selectedRows, setSelectedRows] = useState<CustomResourceDefinition[]>([])
    useEffect(() => {
        setSelectedRows(current || [])
    }, [open])

    const actionRef = useRef<ActionType>()

    const [dataDisks, setDataDisks] = useState<CustomResourceDefinition[]>([])

    return (
        <Drawer
            title="选择系统镜像"
            open={open}
            onClose={onCanel}
            closeIcon={false}
            width={650}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={() => {
                            if (selectedRows.length == 0) return
                            if (onConfirm) onConfirm(selectedRows)
                        }
                        } type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text'>重置</Button>
                </Flex>
            }
        >
            <ProTable<CustomResourceDefinition, Params>
                className={TableStyles["table-container"]}
                rowSelection={{
                    selectedRowKeys: selectedRows.map(dv => namespaceName(dv.metadata)),
                    onChange: (_, selectedRows) => {
                        setSelectedRows(selectedRows)
                    }
                }}
                columns={columns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={dataDisks}
                request={async (params) => {
                    const advancedParams = { searchFilter: searchFilter, params: params }
                    await updateDataDisks(setDataDisks, advancedParams, notification)
                    return { success: true }
                }}
                rowKey={(vm) => namespaceName(vm.metadata)}
                search={false}
                options={{
                    setting: false,
                    density: false,
                    search: {
                        allowClear: true,
                        style: { width: 280 },
                        addonBefore: <Select defaultValue="metadata.name" onChange={(value) => setSearchFilter(value)} options={[
                            { value: 'metadata.name', label: '名称' },
                            { value: 'metadata.namespace', label: '命名空间' },
                        ]} />
                    }
                }}
                pagination={false}
            />
        </Drawer>
    )
}
