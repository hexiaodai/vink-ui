import React, { useState } from 'react'
import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { Table, Spin, TableProps, Tooltip, Space, Button, Input, Drawer, Flex } from 'antd'
import type { DataVolume } from '@/apis/management/datavolume/v1alpha1/datavolume.pb'
import { NameFieldSelector } from '@/utils/search.ts'
import { DiskLabelSelector } from '@/utils/search.ts'
import { TableRowSelection } from 'antd/es/table/interface'
import { useDataVolumes } from '@/hook/datavolume'
import { formatMemory, namespaceNamed } from '@/utils/k8s'
import formItemStyles from '@/common/styles/form-item.module.less'
import styles from '@/pages/virtualmachine/create/styles/add-data-disk.module.less'

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

const columns: TableProps<DataVolume>['columns'] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: {
            showTitle: false,
        },
        render: (_, record) => (<Tooltip title={record.name}>{record.name}</Tooltip>)
    },
    // {
    //     title: '命名空间',
    //     key: 'namespace',
    //     ellipsis: {
    //         showTitle: false,
    //     },
    //     render: (_, record) => (<Tooltip title={record.namespace}>{record.namespace}</Tooltip>)
    // },
    {
        title: '容量',
        key: 'capacity',
        ellipsis: {
            showTitle: false,
        },
        render: (_, dv) => {
            const [value, uint] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
            const capacity = `${value} ${uint}`
            return (<Tooltip title={capacity}>{capacity}</Tooltip>)
        }
    },
    {
        title: '描述',
        key: 'description',
        ellipsis: {
            showTitle: false,
        },
    },
]

const merge = (current: DataVolume[], data: DataVolume[], selectedRow: SelectedRow) => {
    const diskMap = new Map<string, DataVolume>()
    current.forEach(value => {
        const dv = data.find(item => namespaceNamed(item) === namespaceNamed(value))
        if (dv) {
            diskMap.set(namespaceNamed(dv), dv)
        }
    })
    const keys = selectedRow.keys || []
    for (let i = 0; i < keys.length; i++) {
        const dv = data.find(item => namespaceNamed(item) === keys[i])
        if (dv) {
            diskMap.set(namespaceNamed(dv), dv)
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
            newSelectedRow.keys?.push(namespaceNamed(value))
            newSelectedRow.dataVolumes?.push(value)
        })
    }

    if (newSelectedRow.keys?.length ?? 0 > 0) {
        return newSelectedRow
    }
    return null
}

const AddDataDisk: React.FC<AddDataDiskProps> = ({ open, namespace, current, onCanelCallback, onConfirmCallback }) => {
    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], dataVolumes: [] })

    const { opts, setOpts, data, loading } = useDataVolumes({
        namespace: namespace,
        opts: {
            labelsSelector: DiskLabelSelector('data')
        },
    })

    const newSelectedRow = merge(current, data, selectedRow)
    if (newSelectedRow) {
        setSelectedRow(newSelectedRow)
    }

    const rowSelection: TableRowSelection<DataVolume> = {
        selectedRowKeys: selectedRow.keys || [],
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelected(newSelectedRowKeys)
        }
    }

    const handleSelectRow = (dv: DataVolume): void => {
        const key = namespaceNamed(dv)
        let newSelectedRowKeys: React.Key[] = [...(selectedRow.keys || [])]
        if (newSelectedRowKeys?.includes(key)) {
            newSelectedRowKeys = newSelectedRowKeys.filter(k => (k as string) !== key)
        } else {
            newSelectedRowKeys.push(key)
        }

        setSelected(newSelectedRowKeys)
    }

    const setSelected = (keys: React.Key[]): void => {
        const newSelectedRow: SelectedRow = { keys: [], dataVolumes: [] }
        keys.forEach(key => {
            key = key as string
            const dv = data.find(dv => namespaceNamed(dv) === key)
            if (dv) {
                newSelectedRow.keys?.push(key)
                newSelectedRow.dataVolumes?.push(dv)
            }
        })
        setSelectedRow(newSelectedRow)
    }

    const handleCanel = () => {
        if (onCanelCallback) {
            onCanelCallback()
        }
    }

    const handleConfirm = () => {
        if (onConfirmCallback) {
            onConfirmCallback(selectedRow.dataVolumes || [])
        }
    }

    const handleRefresh = () => {
        setOpts({ ...opts })
    }

    const handleSearch = (value: string) => {
        const fieldSelector = NameFieldSelector(value)
        setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: fieldSelector } })
    }

    const handleCleanSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length <= 0) {
            setOpts({ ...opts, opts: { ...opts.opts, fieldSelector: undefined } })
        }
    }

    return (
        <Drawer
            title="选择数据盘"
            open={open}
            onClose={handleCanel}
            closeIcon={false}
            width={600}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={handleConfirm} type="primary">确定</Button>
                        <Button onClick={handleCanel}>取消</Button>
                    </Space>
                    <Button type='text'>重置</Button>
                </Flex>
            }
        >
            <Space>
                <Button
                    icon={<SyncOutlined />}
                    loading={loading}
                    onClick={() => handleRefresh()}
                />
                <Search
                    name='search'
                    placeholder="搜索数据盘"
                    allowClear
                    onSearch={handleSearch}
                    onChange={handleCleanSearch}
                    className={formItemStyles.sw}
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
                                    handleSelectRow(record)
                                },
                            }
                        }}
                        columns={columns} dataSource={data} pagination={false}
                        rowKey={(record) => namespaceNamed(record)}
                    />
                </Spin>
            </div>
        </Drawer>
    )
}

export default AddDataDisk
