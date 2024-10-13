import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { dataDiskDrawerColumns } from './table-columns'
import { instances as annotations } from "@/apis/sdks/ts/annotation/annotations.gen"
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
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
                    getCheckboxProps: (dv) => {
                        const binding = dv.metadata?.annotations[annotations.VinkVirtualmachineBinding.name]
                        if (!binding) {
                            return { disabled: false }
                        }
                        const parse = JSON.parse(binding)
                        return { disabled: parse && parse.length > 0 }
                    }
                }}
                columns={dataDiskDrawerColumns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={dataDisks}
                request={async (params) => {
                    await clients.listResources(GroupVersionResourceEnum.DATA_VOLUME, setDataDisks, {
                        labelSelector: `${labels.VinkDatavolumeType.name}=data`,
                        fieldSelector: (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : undefined,
                        notification: notification
                    })
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
