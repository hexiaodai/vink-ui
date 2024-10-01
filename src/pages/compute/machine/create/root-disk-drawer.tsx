import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { fetchImages } from '@/resource-manager/datavolume'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { rootDiskDrawerColumns } from './table-columns'
import type { ActionType } from '@ant-design/pro-components'
import React from 'react'
import tableStyles from '@/common/styles/table.module.less'

interface RootDiskDrawerProps {
    open?: boolean
    namespace?: string
    current?: CustomResourceDefinition
    onCanel?: () => void
    onConfirm?: (rootDisk?: CustomResourceDefinition) => void
}

export const RootDiskDrawer: React.FC<RootDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
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
                className={tableStyles["table-padding"]}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedRows.length > 0 ? [namespaceName(selectedRows[0].metadata)] : [],
                    onChange: (_, selectedRows) => {
                        setSelectedRows(selectedRows)
                    }
                }}
                tableAlertRender={false}
                columns={rootDiskDrawerColumns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={images}
                request={async (params) => {
                    const advancedParams = { searchFilter: searchFilter, params: params }
                    await fetchImages(setImages, advancedParams, notification)
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
