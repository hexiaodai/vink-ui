import { App, Button, Drawer, Flex, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector } from '@/clients/ts/types/types'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { filterNullish } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { DataVolume, watchDataVolumes } from '@/clients/data-volume'
import type { ProColumns } from '@ant-design/pro-components'
import DataVolumeStatus from '@/components/datavolume-status'
import useUnmount from '@/hooks/use-unmount'

interface DataDiskDrawerProps {
    open: boolean
    current?: DataVolume[]
    onCanel?: () => void
    onConfirm?: (dataDisks: DataVolume[]) => void
}

const dvTypeSelector: FieldSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["data"] }

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.phase", name: "Status",
        items: [
            { inputValue: "Succeeded", values: ["Succeeded"], operator: '=' },
            { inputValue: "Failed", values: ["Failed"], operator: '=' },
            { inputValue: 'Provisioning', values: ["ImportInProgress", "CloneInProgress", "CloneFromSnapshotSourceInProgress", "SmartClonePVCInProgress", "CSICloneInProgress", "ExpansionInProgress", "NamespaceTransferInProgress", "PrepClaimInProgress", "RebindInProgress"], operator: '~=' },
        ]
    }
]

export const DataDiskDrawer: React.FC<DataDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const namespaceName = useNamespaceFromURL()

    const [selectedRows, setSelectedRows] = useState<DataVolume[]>([])

    useEffect(() => {
        setSelectedRows(current || [])
    }, [open])

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespaceName.namespace), dvTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    const [loading, setLoading] = useState(true)
    const [dataVolumes, setDataVolumes] = useState<DataVolume[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        if (!open) {
            return
        }
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchDataVolumes(setDataVolumes, setLoading, abortCtrl.current.signal, opts, notification)
    }, [open, opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespaceName.namespace), dvTypeSelector]))
    }, [namespaceName.namespace])

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
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
        },
        {
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes?.[0]
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
            <CustomTable<DataVolume>
                loading={loading}
                key="data-disk-drawer-table-columns"
                defaultFieldSelectors={defaultFieldSelectors}
                searchItems={searchItems}
                columns={columns}
                updateWatchOptions={setOpts}
                dataSource={dataVolumes}
                rowSelection={{
                    onChange: (_, selectedRows) => { setSelectedRows(selectedRows) },
                    getCheckboxProps: handleCheckboxProps
                }}
                tableAlertOptionRender={() => <></>}
            />
        </Drawer>
    )
}
