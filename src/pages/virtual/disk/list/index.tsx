import { useState } from 'react'
import { Table, Tooltip, Space, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { defaultNamespace, namespaceName } from '@/utils/k8s'
import { useDataVolumes } from '@/apis/datavolume'
import type { TableProps } from 'antd'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import Toolbar from '@/pages/virtual/disk/list/toolbar'
import { TableRowSelection } from 'antd/es/table/interface'
import { LabelsSelectorString, dataVolumeTypeLabelSelector } from '@/utils/search'
import TableColumnAction from '@/pages/virtual/disk/list/table-column-action'
import TableColumnStatus from '@/pages/virtual/disk/list/table-column-status'
import commonTableStyles from '@/common/styles/table.module.less'
import TableColumnCapacity from '@/pages/virtual/disk/list/table-column-capacity'

interface SelectedRow {
    keys: React.Key[]
    dvs: DataVolume[]
}

const addSelectedRow = (selectedRow: SelectedRow, vm: DataVolume) => {
    selectedRow.keys.push(namespaceName(vm))
    selectedRow.dvs.push(vm)
}

const List = () => {
    const { opts, setOpts, data, loading, fetchData, contextHolder } = useDataVolumes({
        namespace: defaultNamespace, opts: {
            labelsSelector: LabelsSelectorString([
                dataVolumeTypeLabelSelector('image')
            ])
        }
    })

    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], dvs: [] })

    const rowSelection: TableRowSelection<DataVolume> = {
        columnWidth: 30,
        selectedRowKeys: selectedRow.keys,
        onChange: (keys: React.Key[]) => {
            const newSelectedRow: SelectedRow = { keys: [], dvs: [] }
            keys.forEach(key => {
                const vm = data.find(v => namespaceName(v) === key)
                if (vm) {
                    addSelectedRow(newSelectedRow, vm)
                }
            })
            setSelectedRow(newSelectedRow)
        }
    }

    const columns: TableProps<DataVolume>['columns'] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => <Tooltip title={dv.name}>{dv.name}</Tooltip>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => <Tooltip title={dv.namespace}>{dv.namespace}</Tooltip>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => <TableColumnStatus dv={dv} />
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => <TableColumnCapacity dv={dv} />
        },
        {
            title: '创建时间',
            key: 'created',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => <Tooltip title={dv.creationTimestamp}>{dv.creationTimestamp}</Tooltip>
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 80,
            align: 'center',
            render: (_, dv) => <TableColumnAction dv={dv} />
        }
    ]

    return (
        <Space className={commonTableStyles['table-container']} direction="vertical">
            <Toolbar
                loading={loading}
                opts={opts}
                setOpts={setOpts}
                fetchData={fetchData}
                selectd={selectedRow.dvs}
            />
            <Spin
                indicator={<LoadingOutlined />}
                spinning={loading}
                delay={500}
            >
                <Table
                    className={commonTableStyles.table}
                    virtual
                    size="middle"
                    pagination={false}
                    rowSelection={rowSelection}
                    rowKey={(dv) => namespaceName(dv)}
                    columns={columns}
                    dataSource={data}
                />
            </Spin>
            {contextHolder}
        </Space>
    )
}

export default List
