import { useEffect, useState } from 'react'
import { Table, Space, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { defaultNamespace, namespaceName } from '@/utils/k8s'
import { DataVolumeManagement } from '@/apis-management/datavolume'
import { TableRowSelection } from 'antd/es/table/interface'
import { LabelsSelectorString, dataVolumeTypeLabelSelector } from '@/utils/search'
import type { TableProps } from 'antd'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import Toolbar from '@/pages/virtual/disk/list/toolbar'
import TableColumnAction from '@/pages/virtual/disk/list/table-column-action'
import TableColumnStatus from '@/pages/virtual/disk/list/table-column-status'
import commonTableStyles from '@/common/styles/table.module.less'
import TableColumnCapacity from '@/pages/virtual/disk/list/table-column-capacity'
import { ListOptions } from '@kubevm.io/vink/common/common.pb'

interface SelectedRow {
    keys: React.Key[]
    dvs: DataVolume[]
}

interface Handler {
    useDataVolumes: (namespace: string, opts: ListOptions) => any
    calculationSelectedRow: (keys: React.Key[], dvs: DataVolume[]) => SelectedRow
}

class DataVolumeListHandler implements Handler {
    private addSelectedRow = (selectedRow: SelectedRow, dv: DataVolume) => {
        selectedRow.keys.push(namespaceName(dv))
        selectedRow.dvs.push(dv)
    }

    useDataVolumes = (namespace: string, initOpts: ListOptions) => {
        return DataVolumeManagement.UseDataVolumes({ namespace: namespace, opts: initOpts })
    }

    calculationSelectedRow = (keys: React.Key[], dvs: DataVolume[]) => {
        const newSelectedRow: SelectedRow = { keys: [], dvs: [] }
        keys.forEach(key => {
            const dv = dvs.find(v => namespaceName(v) === key)
            if (dv) {
                this.addSelectedRow(newSelectedRow, dv)
            }
        })
        return newSelectedRow
    }
}

const List = () => {
    const handler = new DataVolumeListHandler()
    const { opts, setOpts, data, loading, fetchData, notificationContext } = handler.useDataVolumes(
        defaultNamespace,
        {
            labelsSelector: LabelsSelectorString([
                dataVolumeTypeLabelSelector('data')
            ])
        }
    )

    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], dvs: [] })

    useEffect(() => {
        const newSelectedRow = handler.calculationSelectedRow(selectedRow.keys, data)
        setSelectedRow(newSelectedRow)
    }, [data])

    const rowSelection: TableRowSelection<DataVolume> = {
        columnWidth: 25,
        selectedRowKeys: selectedRow.keys,
        onChange: (keys: React.Key[]) => {
            const newSelectedRow = handler.calculationSelectedRow(keys, data)
            setSelectedRow(newSelectedRow)
        }
    }

    const columns: TableProps<DataVolume>['columns'] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => <>{dv.name}</>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, dv) => <>{dv.namespace}</>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <TableColumnStatus dv={dv} />
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => <TableColumnCapacity dv={dv} />
        },
        {
            title: '创建时间',
            key: 'created',
            width: 195,
            ellipsis: true,
            render: (_, dv) => <>{dv.creationTimestamp}</>
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
                selectdDataVolumes={selectedRow.dvs}
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
            <div>{notificationContext}</div>
        </Space>
    )
}

export default List
