import { Badge, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemoryString, namespaceName } from '@/utils/k8s'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { useWatchResources } from '@/hooks/use-resource'
import { replaceDots } from '@/utils/search'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { dataSource, filterNullish } from '@/utils/utils'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { dataVolumeStatusMap } from '@/utils/resource-status'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'

interface RootDiskDrawerProps {
    open?: boolean
    current?: any
    onCanel?: () => void
    onConfirm?: (rootDisk?: any) => void
}

const dvTypeSelector: FieldSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["image"] }

export const RootDiskDrawer: React.FC<RootDiskDrawerProps> = ({ open, current, onCanel, onConfirm }) => {
    const [selectedRows, setSelectedRows] = useState<any[]>([])

    useEffect(() => {
        setSelectedRows(current ? [current] : [])
    }, [open])

    const defaultFieldSelectors = useRef<FieldSelector[]>(filterNullish([dvTypeSelector]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({ fieldSelectorGroup: { fieldSelectors: defaultFieldSelectors.current } }))

    const { resources, loading } = useWatchResources(ResourceType.DATA_VOLUME, opts, !open)

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
                columns={rootDiskDrawerColumns}
                updateWatchOptions={setOpts}
                dataSource={dataSource(resources)}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedRows.length > 0 ? [namespaceName(selectedRows[0].metadata)] : [],
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

export const rootDiskDrawerColumns: ProColumns<any>[] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: true,
        render: (_, dv) => dv.metadata.name
    },
    {
        key: 'status',
        title: '状态',
        ellipsis: true,
        render: (_, dv) => {
            const displayStatus = parseFloat(dv.status.progress) === 100 ? dataVolumeStatusMap[dv.status.phase].text : dv.status.progress
            return <Badge status={dataVolumeStatusMap[dv.status.phase].badge} text={displayStatus} />
        }
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
