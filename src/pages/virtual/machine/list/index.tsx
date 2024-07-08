import { useEffect, useState } from 'react'
import { Table, Space, Spin, TableProps } from 'antd'
import { LoadingOutlined, CodeOutlined } from '@ant-design/icons'
import { defaultNamespace, namespaceName } from '@/utils/k8s'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'
import { TableRowSelection } from 'antd/es/table/interface'
import { TableColumnCPU, TableColumnMem } from '@/pages/virtual/machine/list/table-column-cpu-mem'
import { ListOptions } from '@kubevm.io/vink/common/common.pb'
import Toolbar from '@/pages/virtual/machine/list/toolbar'
import TableColumeAction from '@/pages/virtual/machine/list/table-column-action'
import TableColumeIPv4 from '@/pages/virtual/machine/list/table-column-ipv4'
import commonTableStyles from '@/common/styles/table.module.less'
import TableColumnOperatingSystem from '@/components/table-column-operating-system'
import TableColumnStatus from '@/pages/virtual/machine/list/table-column-status'
import type { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'

interface SelectedRow {
    keys: React.Key[]
    vms: VirtualMachine[]
}

interface Handler {
    useVirtualMachines: (namespace: string, opts: ListOptions) => any
    calculationSelectedRow: (keys: React.Key[], vms: VirtualMachine[]) => SelectedRow
}

class VirtalMachineListHandler implements Handler {
    private addSelectedRow = (selectedRow: SelectedRow, vm: VirtualMachine) => {
        selectedRow.keys.push(namespaceName(vm))
        selectedRow.vms.push(vm)
    }

    useVirtualMachines = (namespace: string, initOpts: ListOptions) => {
        return VirtualMachineManagement.UseVirtualMachines({ namespace: namespace, opts: initOpts })
    }

    calculationSelectedRow = (keys: React.Key[], vms: VirtualMachine[]) => {
        const newSelectedRow: SelectedRow = { keys: [], vms: [] }
        keys.forEach(key => {
            const vm = vms.find(v => namespaceName(v) === key)
            if (vm) {
                this.addSelectedRow(newSelectedRow, vm)
            }
        })
        return newSelectedRow
    }
}

const List = () => {
    const handler = new VirtalMachineListHandler()
    const { opts, setOpts, data, loading, fetchData, notificationContext } = handler.useVirtualMachines(defaultNamespace, {})

    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], vms: [] })

    useEffect(() => {
        const newSelectedRow = handler.calculationSelectedRow(selectedRow.keys, data)
        setSelectedRow(newSelectedRow)
    }, [data])

    const rowSelection: TableRowSelection<VirtualMachine> = {
        columnWidth: 25,
        selectedRowKeys: selectedRow.keys,
        onChange: (keys: React.Key[]) => {
            const newSelectedRow = handler.calculationSelectedRow(keys, data)
            setSelectedRow(newSelectedRow)
        }
    }

    const columns: TableProps<VirtualMachine>['columns'] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, vm) => <>{vm.name}</>
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vm) => <>{vm.namespace}</>
        },
        {
            key: 'console',
            title: '控制台',
            ellipsis: true,
            render: (_, vm) => <CodeOutlined />
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, vm) => <TableColumnStatus vm={vm} />
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, vm) => <TableColumnOperatingSystem dv={vm.virtualMachineDataVolume?.root} />
        },
        {
            key: 'ipv4',
            title: 'IPv4',
            ellipsis: true,
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
            ellipsis: true,
            render: (_, vm) => <>{vm.virtualMachineInstance?.status?.nodeName}</>
        },
        {
            title: '创建时间',
            key: 'created',
            width: 195,
            ellipsis: true,
            render: (_, vm) => <>{vm.creationTimestamp}</>
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
            {/* <Summary /> */}

            <Toolbar
                loading={loading}
                opts={opts}
                setOpts={setOpts}
                fetchData={fetchData}
                selectdVirtuaMachines={selectedRow.vms}
            />

            <Spin
                indicator={<LoadingOutlined />}
                spinning={loading}
                delay={500}
            >
                <Table
                    className={commonTableStyles.table}
                    virtual
                    pagination={false}
                    rowSelection={rowSelection}
                    rowKey={(vm) => namespaceName(vm)}
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: 1350, y: '100vh' }}
                />
            </Spin>
            <div>{notificationContext}</div>
        </Space>
    )
}

export default List
