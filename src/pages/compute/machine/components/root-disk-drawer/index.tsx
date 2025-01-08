import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey } from '@/utils/k8s'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { replaceDots } from '@/utils/search'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { filterNullish, getErrorMessage } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { DataVolume, watchDataVolumes } from '@/clients/data-volume'
import { getResourceName } from '@/clients/clients'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import DataVolumeStatus from '@/components/datavolume-status'
import useUnmount from '@/hooks/use-unmount'

interface RootDiskDrawerProps {
    open: boolean
    current?: DataVolume
    onCanel?: () => void
    onConfirm?: (rootDisk: DataVolume) => void
}

const dvTypeSelector: FieldSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["image"] }

export const RootDiskDrawer: React.FC<RootDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    useEffect(() => {
        setSelectedRows(current ? [current] : [])
    }, [open])

    const defaultFieldSelectors = useRef<FieldSelector[]>(filterNullish([dvTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({ fieldSelectorGroup: { fieldSelectors: defaultFieldSelectors.current } }))

    const [loading, setLoading] = useState(true)
    const [dataVolumes, setDataVolumes] = useState<DataVolume[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchDataVolumes(setDataVolumes, setLoading, abortCtrl.current.signal, opts).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.DATA_VOLUME),
                description: getErrorMessage(err)
            })
        })
    }, [opts])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(ResourceType.DATA_VOLUME))
        abortCtrl.current?.abort()
    })

    const columns: ProColumns<any>[] = [
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
            render: (_, dv) => dv.spec?.pvc?.resources?.requests?.storage
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
            <CustomTable
                loading={loading}
                storageKey="root-disk-drawer-table-columns"
                defaultFieldSelectors={defaultFieldSelectors.current}
                searchItems={searchItems}
                columns={columns}
                updateWatchOptions={setOpts}
                dataSource={dataVolumes}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedRows.length > 0 ? [namespaceNameKey(selectedRows[0].metadata)] : [],
                    onChange: (_, selectedRows) => setSelectedRows(selectedRows)
                }}
                tableAlertOptionRender={() => <></>}
            />
        </Drawer>
    )
}

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.phase", name: "Status",
        items: [
            { inputValue: "Succeeded", values: ["Succeeded"], operator: '=' },
            { inputValue: "Failed", values: ["Failed"], operator: '=' },
            { inputValue: 'Provisioning', values: ["ImportInProgress", "CloneInProgress", "CloneFromSnapshotSourceInProgress", "SmartClonePVCInProgress", "CSICloneInProgress", "ExpansionInProgress", "NamespaceTransferInProgress", "PrepClaimInProgress", "RebindInProgress"], operator: '~=' },
        ]
    },
    {
        fieldPath: `metadata.labels.${replaceDots("vink.kubevm.io/virtualmachine.os")}`, name: "OS",
        items: [
            { inputValue: "Ubuntu", values: ["Ubuntu"], operator: '=' },
            { inputValue: "CentOS", values: ["CentOS"], operator: '=' },
            { inputValue: "Debian", values: ["Debian"], operator: '=' },
            { inputValue: "Linux", values: ["Linux", "Ubuntu", "CentOS", "Debian"], operator: '~=' },
            { inputValue: "Windows", values: ["Windows"], operator: '=' },
        ]
    },
]
