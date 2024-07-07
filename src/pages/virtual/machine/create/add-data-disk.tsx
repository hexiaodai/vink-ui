import React, { useState } from 'react'
import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { Table, Spin, TableProps, Space, Button, Input, Drawer, Flex } from 'antd'
import { ListOptions, NameFieldSelector } from '@/utils/search.ts'
import { dataVolumeTypeLabelSelector } from '@/utils/search.ts'
import { TableRowSelection } from 'antd/es/table/interface'
import { DataVolumeManagement } from '@/apis-management/datavolume'
import { formatMemory, namespaceName } from '@/utils/k8s'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import styles from '@/pages/virtual/machine/create/styles/add-data-disk.module.less'

const { Search } = Input

interface SelectedRow {
    keys?: React.Key[]
    dataVolumes?: DataVolume[]
}

interface AddDataDiskProps {
    open: boolean
    namespace: string
    current: DataVolume[]
    onCanelCallback?: () => void
    onConfirmCallback?: (disks: DataVolume[]) => void
}

class AddDataDiskHandler {
    private props: AddDataDiskProps

    constructor(props: AddDataDiskProps) {
        this.props = props
    }

    useDataVolumes = () => {
        return DataVolumeManagement.UseDataVolumes({
            namespace: this.props.namespace,
            opts: {
                labelsSelector: dataVolumeTypeLabelSelector('data')
            },
        })
    }

    setSelected = (setSelectedRow: React.Dispatch<React.SetStateAction<SelectedRow>>, data: DataVolume[], keys: React.Key[]): void => {
        const newSelectedRow: SelectedRow = { keys: [], dataVolumes: [] }
        keys.forEach(key => {
            key = key as string
            const dv = data.find(dv => namespaceName(dv) === key)
            if (dv) {
                newSelectedRow.keys?.push(key)
                newSelectedRow.dataVolumes?.push(dv)
            }
        })
        setSelectedRow(newSelectedRow)
    }

    selectRow = (selectedRow: SelectedRow, setSelectedRow: React.Dispatch<React.SetStateAction<SelectedRow>>, data: DataVolume[], dv: DataVolume): void => {
        const key = namespaceName(dv)
        let newSelectedRowKeys: React.Key[] = [...(selectedRow.keys || [])]
        if (newSelectedRowKeys?.includes(key)) {
            newSelectedRowKeys = newSelectedRowKeys.filter(k => (k as string) !== key)
        } else {
            newSelectedRowKeys.push(key)
        }

        this.setSelected(setSelectedRow, data, newSelectedRowKeys)
    }

    merge = (current: DataVolume[], data: DataVolume[], selectedRow: SelectedRow) => {
        const diskMap = new Map<string, DataVolume>()
        current.forEach(value => {
            const dv = data.find(item => namespaceName(item) === namespaceName(value))
            if (dv) {
                diskMap.set(namespaceName(dv), dv)
            }
        })
        const keys = selectedRow.keys || []
        for (let i = 0; i < keys.length; i++) {
            const dv = data.find(item => namespaceName(item) === keys[i])
            if (dv) {
                diskMap.set(namespaceName(dv), dv)
            }
        }
        let diff = false
        for (let i = 0; i < keys.length; i++) {
            if (!diskMap.has(keys[i] as string)) {
                diff = true
                break
            }
        }
        const newSelectedRow: SelectedRow = { keys: [], dataVolumes: [] }
        if (diff || keys.length !== diskMap.size) {
            diskMap.forEach(value => {
                newSelectedRow.keys?.push(namespaceName(value))
                newSelectedRow.dataVolumes?.push(value)
            })
        }

        if ((newSelectedRow.keys?.length || 0) > 0) {
            return newSelectedRow
        }
        return null
    }

    capacity = (dv: DataVolume) => {
        const [value, unit] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
        return `${value} ${unit}`
    }

    refresh = (opts: ListOptions, setOpts: React.Dispatch<React.SetStateAction<ListOptions>>) => {
        setOpts({ ...opts })
    }

    search = (opts: ListOptions, setOpts: React.Dispatch<React.SetStateAction<ListOptions>>, value: string) => {
        const fieldSelector = NameFieldSelector(value)
        setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: fieldSelector } })
    }

    cleanSearch = (opts: ListOptions, setOpts: React.Dispatch<React.SetStateAction<ListOptions>>, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= 0) {
            setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: undefined } })
        }
    }

    cancel = () => {
        if (this.props.onCanelCallback) this.props.onCanelCallback()
    }

    confirm = (selectedRow: SelectedRow) => {
        if (this.props.onConfirmCallback) {
            this.props.onConfirmCallback(selectedRow.dataVolumes || [])
        }
    }
}

const AddDataDisk: React.FC<AddDataDiskProps> = ({ open, namespace, current, onCanelCallback, onConfirmCallback }) => {
    const handler = new AddDataDiskHandler({ open, namespace, current, onCanelCallback, onConfirmCallback })
    const { opts, setOpts, data, loading } = handler.useDataVolumes()

    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], dataVolumes: [] })

    const newSelectedRow = handler.merge(current, data, selectedRow)
    if (newSelectedRow) {
        setSelectedRow(newSelectedRow)
    }

    const rowSelection: TableRowSelection<DataVolume> = {
        selectedRowKeys: selectedRow.keys || [],
        onChange: (newSelectedRowKeys: React.Key[]) => {
            handler.setSelected(setSelectedRow, data, newSelectedRowKeys)
        }
    }

    const columns: TableProps<DataVolume>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, record) => (<>{record.name}</>)
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => handler.capacity(dv)
        },
        {
            title: '描述',
            key: 'description',
            ellipsis: true
        },
    ]

    return (
        <Drawer
            title="选择数据盘"
            open={open}
            onClose={() => handler.cancel()}
            closeIcon={false}
            width={600}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={() => handler.confirm(selectedRow)} type="primary">确定</Button>
                        <Button onClick={() => handler.cancel()}>取消</Button>
                    </Space>
                    <Button type='text'>重置</Button>
                </Flex>
            }
        >
            <Space>
                <Button
                    icon={<SyncOutlined />}
                    loading={loading}
                    onClick={() => handler.refresh(opts, setOpts)}
                />
                <Search
                    name='search'
                    placeholder="搜索数据盘"
                    allowClear
                    onSearch={(value: string) => handler.search(opts, setOpts, value)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handler.cleanSearch(opts, setOpts, e)}
                />
            </Space>

            <div className={styles['table-container']}>
                <Spin
                    indicator={<LoadingOutlined />}
                    spinning={loading}
                    delay={500}
                >
                    <Table
                        size="middle"
                        rowSelection={rowSelection}
                        onRow={(record) => {
                            return {
                                onClick: () => {
                                    handler.selectRow(selectedRow, setSelectedRow, data, record)
                                },
                            }
                        }}
                        columns={columns} dataSource={data} pagination={false}
                        rowKey={(record) => namespaceName(record)}
                    />
                </Spin>
            </div>
        </Drawer>
    )
}

export default AddDataDisk
