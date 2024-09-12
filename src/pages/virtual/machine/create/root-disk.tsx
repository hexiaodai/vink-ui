import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemory, namespaceName } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { jsonParse } from '@/utils/utils'
import { updateImages } from './resource-manager'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import TableStyles from '@/common/styles/table.module.less'
import TableColumnOperatingSystem from '@/components/table-column/operating-system'
import React from 'react'

interface RootDiskProps {
    open?: boolean
    namespace?: string
    current?: CustomResourceDefinition
    onCanel?: () => void
    onConfirm?: (rootDisk?: CustomResourceDefinition) => void
}

const columns: ProColumns<CustomResourceDefinition>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => (<>{dv.metadata?.name}</>)
    },
    {
        title: '操作系统',
        key: 'operatingSystem',
        ellipsis: true,
        render: (_, dv) => (<TableColumnOperatingSystem rootDataVolume={dv} />)
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
    }
]

export const RootDisk: React.FC<RootDiskProps> = ({ open, current, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const [searchFilter, setSearchFilter] = useState<string>("name")
    const [selectedRows, setSelectedRows] = useState<CustomResourceDefinition[]>([])
    useEffect(() => {
        setSelectedRows(current ? [current] : [])
    }, [open])

    const actionRef = useRef<ActionType>()

    const [images, setImages] = useState<CustomResourceDefinition[]>([])

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
                            if (onConfirm) onConfirm(selectedRows[0])
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
                    type: 'radio',
                    selectedRowKeys: selectedRows.length > 0 ? [namespaceName(selectedRows[0].metadata)] : [],
                    onChange: (_, selectedRows) => {
                        setSelectedRows(selectedRows)
                    }
                }}
                tableAlertRender={false}
                columns={columns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={images}
                request={async (params) => {
                    const advancedParams = { searchFilter: searchFilter, params: params }
                    await updateImages(setImages, advancedParams, notification)
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
                            { value: `labels[${labels.VinkVirtualmachineOs.name}]`, label: '操作系统' }
                        ]} />
                    }
                }}
                pagination={false}
            />
        </Drawer>
    )
}
