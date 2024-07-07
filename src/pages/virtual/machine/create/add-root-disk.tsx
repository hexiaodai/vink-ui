import React, { useState } from 'react'
import { Button, Space, Table, Spin, Input, TableProps, Drawer, Flex, Segmented } from 'antd'
import { LoadingOutlined, SyncOutlined } from '@ant-design/icons'
import { virtualMachineOSLabelSelector, LabelsSelectorString, NameFieldSelector, dataVolumeTypeLabelSelector, ListOptions } from '@/utils/search.ts'
import { namespaceName, formatMemory, GetDescription } from '@/utils/k8s'
import { IconFont } from '@/components/icon'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { DataVolumeManagement } from '@/apis-management/datavolume'
import styles from '@/pages/virtual/machine/create/styles/add-root-disk.module.less'
import TableColumnOperatingSystem from '@/components/table-column-operating-system'

const { Search } = Input

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

class AddRootDiskHandler {
    private props: AddRootDiskProps

    constructor(props: AddRootDiskProps) {
        this.props = props
    }

    useDataVolumes = () => {
        return DataVolumeManagement.UseDataVolumes({
            namespace: this.props.namespace,
            opts: {
                labelsSelector: LabelsSelectorString([
                    virtualMachineOSLabelSelector('centos'),
                    dataVolumeTypeLabelSelector('image')
                ])
            },
        })
    }

    refresh = (opts: ListOptions, setOpts: React.Dispatch<React.SetStateAction<ListOptions>>) => {
        setOpts({ ...opts })
    }

    changeTabs = (opts: ListOptions, setOpts: React.Dispatch<React.SetStateAction<ListOptions>>, family: string) => {
        const labelsSelector = LabelsSelectorString([
            virtualMachineOSLabelSelector(family),
            dataVolumeTypeLabelSelector('image')
        ])
        setOpts({ ...opts, opts: { ...opts.opts, labelsSelector: labelsSelector } })
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

    selectRow = (setSelectedRow: React.Dispatch<React.SetStateAction<SelectedRow>>, dv: DataVolume) => {
        const key = namespaceName(dv)
        setSelectedRow({ key: key, dataVolume: dv })
    }

    cancel = () => {
        if (this.props.onCanel) this.props.onCanel()
    }

    confirm = (selectedRow: SelectedRow) => {
        if (this.props.onConfirm) {
            this.props.onConfirm(selectedRow.dataVolume)
        }
    }

    capacity = (dv: DataVolume) => {
        const [value, unit] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
        return `${value} ${unit}`
    }

    description = (dv: DataVolume) => {
        return GetDescription(dv.dataVolume?.metadata?.labels || {})
    }
}

const AddRootDisk: React.FC<AddRootDiskProps> = ({ open, namespace, current, onCanel, onConfirm }) => {
    const [selectedRow, setSelectedRow] = useState<SelectedRow>({
        key: namespaceName(current || {}),
        dataVolume: current
    })

    const handler = new AddRootDiskHandler({ open, namespace, current, onCanel, onConfirm })

    const { opts, setOpts, data, loading } = handler.useDataVolumes()

    const columns: TableProps<DataVolume>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => (<>{dv.name}</>)
        },
        {
            title: '操作系统',
            key: 'operatingSystem',
            ellipsis: true,
            render: (_, dv) => (<TableColumnOperatingSystem dv={dv} />)
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => <>{handler.capacity(dv)}</>
        },
        {
            title: '描述',
            key: 'description',
            ellipsis: true,
            render: (_, dv) => <>{handler.description(dv)}</>
        },
    ]

    return (
        <Drawer
            title="选择系统镜像"
            open={open}
            onClose={handler.cancel}
            closeIcon={false}
            width={600}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={() => handler.confirm(selectedRow)} type="primary">确定</Button>
                        <Button onClick={handler.cancel}>取消</Button>
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
                    placeholder="搜索系统镜像"
                    allowClear
                    onSearch={(value: string) => handler.search(opts, setOpts, value)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handler.cleanSearch(opts, setOpts, e)}
                />
            </Space>

            <div className={styles.tabs}>
                <Segmented
                    defaultValue='centos'
                    onChange={(value: string) => handler.changeTabs(opts, setOpts, value)}
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
                                handler.selectRow(setSelectedRow, record)
                            }
                        }
                    }}
                    columns={columns} dataSource={data} pagination={false}
                    rowKey={(record) => namespaceName(record)} />
            </Spin>
        </Drawer>
    )
}

export default AddRootDisk
