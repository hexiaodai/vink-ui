import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { fetchDataDisks } from '@/resource-manager/datavolume'
import { dataDiskDrawerColumns } from './table-columns'
import { instances as annotations } from "@/apis/sdks/ts/annotation/annotations.gen"
import type { ActionType } from '@ant-design/pro-components'
import React from 'react'
import tableStyles from '@/common/styles/table.module.less'

interface DataDiskDrawerProps {
    open?: boolean
    namespace?: string
    current?: CustomResourceDefinition[]
    onCanel?: () => void
    onConfirm?: (dataDisks: CustomResourceDefinition[]) => void
}

export const DataDiskDrawer: React.FC<DataDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
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
                className={tableStyles["table-padding"]}
                rowSelection={{
                    selectedRowKeys: selectedRows.map(dv => namespaceName(dv.metadata)),
                    onChange: (_, selectedRows) => {
                        setSelectedRows(selectedRows)
                    },
                    getCheckboxProps: (record) => ({
                        disabled: record.metadata?.annotations[annotations.VinkVirtualmachineBinding.name]
                            ? record.metadata.annotations[annotations.VinkVirtualmachineBinding.name].length > 0
                            : undefined
                    })
                }}
                columns={dataDiskDrawerColumns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={dataDisks}
                request={async (params) => {
                    const advancedParams = { searchFilter: searchFilter, params: params }
                    await fetchDataDisks(setDataDisks, advancedParams, notification)
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
                            { value: 'metadata.name', label: '名称' }
                        ]} />
                    }
                }}
                pagination={false}
            />
        </Drawer>
    )
}
