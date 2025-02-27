import { Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useState } from 'react'
import { namespaceNameKey, namespaceNameString } from '@/utils/k8s'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { labelSelector } from '@/utils/search'
import { ResourceTable } from '@/components/resource-table'
import { DataVolume } from '@/clients/data-volume'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import DataVolumeStatus from '@/components/datavolume-status'

interface RootDiskDrawerProps {
    open: boolean
    current?: DataVolume
    onCanel?: () => void
    onConfirm?: (rootDisk: DataVolume) => void
}

const dvTypeSelector: FieldSelector = FieldSelector.create({ fieldPath: labelSelector(labels.VinkDatavolumeType.name), operator: "=", values: ["image"] })

export const RootDiskDrawer: React.FC<RootDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const [selectedRows, setSelectedRows] = useState<DataVolume[]>()

    useEffect(() => {
        setSelectedRows(current ? [current] : [])
    }, [open])

    const columns: ProColumns<DataVolume>[] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => dv.metadata!.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <DataVolumeStatus dv={dv} />
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
            render: (_, dv) => dv.spec.pvc?.resources?.requests?.storage
        }
    ]

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
                            if (!selectedRows || selectedRows.length == 0 || !onConfirm) {
                                return
                            }
                            onConfirm(selectedRows[0])
                        }} type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                </Flex>
            }
        >
            <ResourceTable<DataVolume>
                tableKey="root-disk-drawer-list"
                resourceType={ResourceType.DATA_VOLUME}
                columns={columns}
                defaultSelecoters={[dvTypeSelector]}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: (selectedRows && selectedRows.length > 0) ? [namespaceNameString(selectedRows[0])] : [],
                    onChange: (_, selectedRows) => setSelectedRows(selectedRows)
                }}
            />
        </Drawer>
    )
}
