import { LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { Button, Drawer, Flex, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemoryString, namespaceName, namespaceNameKey } from '@/utils/k8s'
import { Params } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { ResourceType } from '@/clients/ts/types/resource'
import { useListResources } from '@/hooks/use-resource'
import { ListOptions } from '@/clients/ts/types/list_options'
import { fieldSelector } from '@/utils/search'
import { emptyOptions } from '@/clients/clients'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import React from 'react'
import tableStyles from '@/common/styles/table.module.less'
import OperatingSystem from '@/components/operating-system'

interface RootDiskDrawerProps {
    open?: boolean
    current?: any
    onCanel?: () => void
    onConfirm?: (rootDisk?: any) => void
}

export const RootDiskDrawer: React.FC<RootDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const [selectedRows, setSelectedRows] = useState<any[]>([])

    useEffect(() => {
        setSelectedRows(current ? [current] : [])
    }, [open])

    const actionRef = useRef<ActionType>()

    const [opts, setOpts] = useState<ListOptions>(emptyOptions({ labelSelector: `${labels.VinkDatavolumeType.name}=image` }))

    const { resources: images } = useListResources(ResourceType.DATA_VOLUME, opts)

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
                            if (selectedRows.length == 0 || !onConfirm) {
                                return
                            }
                            onConfirm(selectedRows[0])
                        }} type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text'>重置</Button>
                </Flex>
            }
        >
            <ProTable<any, Params>
                className={tableStyles["table-padding"]}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedRows.length > 0 ? [namespaceName(selectedRows[0].metadata)] : [],
                    onChange: (_, selectedRows) => setSelectedRows(selectedRows)
                }}
                tableAlertRender={false}
                columns={rootDiskDrawerColumns}
                actionRef={actionRef}
                loading={{ indicator: <LoadingOutlined /> }}
                dataSource={images}
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


export const rootDiskDrawerColumns: ProColumns<any>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata.name
    },
    {
        title: '操作系统',
        key: 'operatingSystem',
        ellipsis: true,
        render: (_, dv) => <OperatingSystem dv={dv} />
    },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: true,
        render: (_, dv) => formatMemoryString(dv.spec.pvc.resources.requests.storage)
    }
]
