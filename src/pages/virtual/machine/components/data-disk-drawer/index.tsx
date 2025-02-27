import { Button, Drawer, Flex, Popover, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { labelSelector } from '@/utils/search'
import { DataVolume } from '@/clients/data-volume'
import { ResourceTable } from '@/components/resource-table'
import type { ProColumns } from '@ant-design/pro-components'
import DataVolumeStatus from '@/components/datavolume-status'
import { namespaceNameString } from '@/utils/k8s'

interface DataDiskDrawerProps {
    open: boolean
    current?: DataVolume[]
    onCanel?: () => void
    onConfirm?: (dataDisks: DataVolume[]) => void
}

const dvTypeSelector: FieldSelector = FieldSelector.create({ fieldPath: labelSelector(labels.VinkDatavolumeType.name), operator: "=", values: ["data"] })

export const DataDiskDrawer: React.FC<DataDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const [selectedRows, setSelectedRows] = useState<DataVolume[]>()

    useEffect(() => {
        setSelectedRows(current)
    }, [open])

    const handleCheckboxProps = (dv: DataVolume) => {
        const owner = dv.metadata!.annotations?.[annotations.VinkDatavolumeOwner.name]
        if (!owner || (owner as string).length == 0) {
            return { disabled: false }
        }
        const parse = JSON.parse(owner)
        return { disabled: parse && parse.length > 0 }
    }

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
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.resources?.requests?.storage
        },
        {
            key: 'owner',
            title: 'Owner',
            ellipsis: true,
            render: (_, dv) => {
                const owners = dv.metadata!.annotations?.[annotations.VinkDatavolumeOwner.name]
                if (!owners) {
                    return
                }

                const parse: string[] = JSON.parse(owners)
                if (parse.length == 0) {
                    return
                }

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
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes?.[0]
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
        }
    ]

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
                            if (selectedRows && selectedRows.length > 0) {
                                onConfirm?.(selectedRows)
                            }
                        }
                        } type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                </Flex>
            }
        >
            <ResourceTable<DataVolume>
                tableKey="data-disk-drawer-list"
                resourceType={ResourceType.DATA_VOLUME}
                columns={columns}
                defaultSelecoters={[dvTypeSelector]}
                rowSelection={{
                    selectedRowKeys: (selectedRows && selectedRows.length > 0) ? selectedRows.map(dv => namespaceNameString(dv)) : [],
                    onChange: (_, selectedRows) => { setSelectedRows(selectedRows) },
                    getCheckboxProps: handleCheckboxProps
                }}
            />
        </Drawer>
    )
}
