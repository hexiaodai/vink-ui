import { useState } from 'react'
import { Table, Tooltip, Space, Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { defaultNamespace, namespaceName } from '@/utils/k8s'
import { useVirtualMachines } from '@/apis/virtualmachine'
import type { TableProps } from 'antd'
import type { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { TableRowSelection } from 'antd/es/table/interface'
import Toolbar from '@/pages/virtual/machine/list/toolbar'
import TableColumeAction from '@/pages/virtual/machine/list/table-column-action'
import TableColumeIPv4 from '@/pages/virtual/machine/list/table-column-ipv4'
import commonTableStyles from '@/common/styles/table.module.less'
import TableColumnOperatingSystem from '@/components/table-column-operating-system'
import TableColumnStatus from '@/pages/virtual/machine/list/table-column-status'
import { TableColumnCPU, TableColumnMem } from '@/pages/virtual/machine/list/table-column-cpu-mem'

interface SelectedRow {
    keys: React.Key[]
    vms: VirtualMachine[]
}

const addSelectedRow = (selectedRow: SelectedRow, vm: VirtualMachine) => {
    selectedRow.keys.push(namespaceName(vm))
    selectedRow.vms.push(vm)
}

const List = () => {
    const { opts, setOpts, data, loading, fetchData, contextHolder } = useVirtualMachines({ namespace: defaultNamespace, opts: {} })
    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], vms: [] })

    const rowSelection: TableRowSelection<VirtualMachine> = {
        columnWidth: 30,
        selectedRowKeys: selectedRow.keys,
        onChange: (keys: React.Key[]) => {
            const newSelectedRow: SelectedRow = { keys: [], vms: [] }
            keys.forEach(key => {
                const vm = data.find(v => namespaceName(v) === key)
                if (vm) {
                    addSelectedRow(newSelectedRow, vm)
                }
            })
            setSelectedRow(newSelectedRow)
        }
    }

    const columns: TableProps<VirtualMachine>['columns'] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <Tooltip title={vm.name}>{vm.name}</Tooltip>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <Tooltip title={vm.namespace}>{vm.namespace}</Tooltip>
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <TableColumnStatus vm={vm} />
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <TableColumnOperatingSystem dv={vm.virtualMachineDataVolume?.root} />
        },
        {
            key: 'ipv4',
            title: 'IPv4',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <TableColumeIPv4 vm={vm} />
        },
        {
            key: 'cpu',
            title: '处理器',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <TableColumnCPU vm={vm} />
        },
        {
            key: 'memory',
            title: '内存',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <TableColumnMem vm={vm} />
        },
        {
            key: 'node',
            title: '节点',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <Tooltip title={vm.virtualMachineInstance?.status?.nodeName}>{vm.virtualMachineInstance?.status?.nodeName}</Tooltip>
        },
        {
            title: '创建时间',
            key: 'created',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => <Tooltip title={vm.creationTimestamp}>{vm.creationTimestamp}</Tooltip>
        },
        {
            title: '操作',
            key: 'action',
            fixed: 'right',
            width: 80,
            align: 'center',
            render: (_, vm) => <TableColumeAction vm={vm} />
        }
    ]

    return (
        <Space className={commonTableStyles['table-container']} direction="vertical">
            <Toolbar
                loading={loading}
                opts={opts}
                setOpts={setOpts}
                fetchData={fetchData}
                selectd={selectedRow.vms}
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
                    rowKey={(vm) => namespaceName(vm)}
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: 1200, y: 300 }}
                />
            </Spin>
            <div>{contextHolder}</div>
        </Space>
    )
}

export default List
