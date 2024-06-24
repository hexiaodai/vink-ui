import React, { useState } from 'react'
import { Button, Space, Table, Spin, Input, TableProps, Tooltip, Drawer, Flex, Segmented } from 'antd'
import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { DiskLabelSelector, LabelsSelectorString, NameFieldSelector, OSFamilyLabelSelector } from '@/utils/search.ts'
import { namespaceNamed, formatMemory, formatOSFamily, GetDescription, getOperatingSystem } from '@/utils/k8s'
import { IconFont } from '@/common/icon'
import type { DataVolume } from '@/apis/management/datavolume/v1alpha1/datavolume.pb'
import { useDataVolumes } from '@/hook/datavolume'
import formItemStyles from '@/common/styles/form-item.module.less'
import styles from '@/pages/virtualmachine/create/styles/add-root-disk.module.less'

const { Search } = Input

const columns: TableProps<DataVolume>['columns'] = [
    {
        title: '名称',
        key: 'name',
        ellipsis: {
            showTitle: false,
        },
        render: (_, dv) => (<Tooltip title={dv.name}>{dv.name}</Tooltip>)
    },
    {
        title: '操作系统',
        key: 'operatingSystem',
        ellipsis: {
            showTitle: false,
        },
        render: (_, dv) => {
            const osInfo = getOperatingSystem(dv)
            const fv = `${formatOSFamily(osInfo.family)} ${osInfo.version}`
            return (<Tooltip title={fv}>{fv}</Tooltip>)
        }
    },
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
        render: (_, record) => {
            const desc = GetDescription(record.dataVolume.metadata.labels || {})
            return (<Tooltip title={desc}>{desc}</Tooltip>)
        }
    },
]

interface AddRootDiskProps {
    open?: boolean
    namespace?: string
    current?: DataVolume
    onCanel?: () => void
    onConfirm?: (disk?: DataVolume) => void
}

interface SelectedRow {
    key?: React.Key
    dataVolume?: DataVolume
}

const AddRootDisk: React.FC<AddRootDiskProps> = ({ open, namespace, current, onCanel, onConfirm }) => {
    const [selectedRow, setSelectedRow] = useState<SelectedRow>({
        key: namespaceNamed(current || {}),
        dataVolume: current
    })

    const { opts, setOpts, data, loading } = useDataVolumes({
        namespace: namespace,
        opts: {
            labelsSelector: DiskLabelSelector('boot')
        },
    })

    const handleRefresh = () => {
        setOpts({ ...opts })
    }

    const handleChangeTabs = (family: string) => {
        const labelsSelector = LabelsSelectorString([OSFamilyLabelSelector(family), DiskLabelSelector('boot')])
        setOpts({ ...opts, opts: { ...opts.opts, labelsSelector: labelsSelector } })
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

    const handleSelectRow = (dv: DataVolume) => {
        const key = namespaceNamed(dv)
        setSelectedRow({ key: key, dataVolume: dv })
    }

    const handleCanel = () => {
        if (onCanel) onCanel()
    }

    const handleConfirm = () => {
        if (onConfirm) onConfirm(selectedRow.dataVolume)
    }

    return (
        <Drawer
            title="选择系统镜像"
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
                    placeholder="搜索系统镜像"
                    allowClear
                    onSearch={handleSearch}
                    onChange={handleCleanSearch}
                    className={formItemStyles.sw}
                />
            </Space>

            <div className={styles.tabs}>
                <Segmented
                    defaultValue='centos'
                    onChange={handleChangeTabs}
                    options={[
                        {
                            label: (
                                <Flex style={{ padding: "3px" }} justify="center" align="center">
                                    <IconFont type={"icon-centos"} className={styles.tabsIcon} />
                                    <span>CentOS</span>
                                </Flex>
                            ),
                            value: 'centos',
                        },
                        {
                            label: (
                                <Flex style={{ padding: "3px" }} justify="center" align="center">
                                    <IconFont type={"icon-ubuntu"} className={styles.tabsIcon} />
                                    <span>Ubuntu</span>
                                </Flex>
                            ),
                            value: 'ubuntu',
                        },
                        {
                            label: (
                                <Flex style={{ padding: "3px" }} justify="center" align="center">
                                    <IconFont type={"icon-debian"} className={styles.tabsIcon} />
                                    <span>Debian</span>
                                </Flex>
                            ),
                            value: 'debian',
                        },
                        {
                            label: (
                                <Flex style={{ padding: "3px" }} justify="center" align="center">
                                    <IconFont type={"icon-windows"} className={styles.tabsIcon} />
                                    <span>Windows</span>
                                </Flex>
                            ),
                            value: 'windows',
                        },
                    ]}
                />
            </div>
            <Spin indicator={<LoadingOutlined />} spinning={loading} delay={500}>
                <Table
                    size="middle"
                    rowSelection={{ type: 'radio', selectedRowKeys: [selectedRow.key || ''] }}
                    onRow={(record) => {
                        return {
                            onClick: () => {
                                handleSelectRow(record)
                            },
                        }
                    }}
                    columns={columns} dataSource={data} pagination={false}
                    rowKey={(record) => namespaceNamed(record)} />
            </Spin>
        </Drawer >
    )
}

export default AddRootDisk
