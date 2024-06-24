import { useState } from 'react'
import { Table, Dropdown, Badge, Tooltip, Space, Spin, Flex } from 'antd'
import { LoadingOutlined, EllipsisOutlined } from '@ant-design/icons'
import { sleep } from '@/utils/time.ts'
import { extractIPFromCIDR } from '@/utils/ip.ts'
import { VirtualMachineManagement, ManageVirtualMachinePowerStateRequestPowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { getOperatingSystem, formatOSFamily, formatMemory, statusMap, DefaultNamespace, namespaceNamed } from '@/utils/k8s'
import { IconFont } from '@/common/icon'
import { useVirtualMachines } from '@/hook/virtualmachines'
import { useErrorNotification } from '@/common/notification'

import type { MenuProps, TableProps } from 'antd'
import type { VirtualMachine } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine.pb'

import styles from '@/pages/virtualmachine/list/index.module.less'
import commonStyles from '@/common/styles/common.module.less'
import fontStyles from '@/common/styles/font.module.less'
import Toolbar from '@/pages/virtualmachine/list/toolbar'
import { TableRowSelection } from 'antd/es/table/interface'

interface SelectedRow {
    keys: React.Key[]
    vms: VirtualMachine[]
}

const addSelectedRow = (selectedRow: SelectedRow, vm: VirtualMachine) => {
    selectedRow.keys.push(namespaceNamed(vm))
    selectedRow.vms.push(vm)
}

const List = () => {
    const { opts, setOpts, data, loading, fetchData, contextHolder } = useVirtualMachines({ namespace: DefaultNamespace, opts: {} })
    const [selectedRow, setSelectedRow] = useState<SelectedRow>({ keys: [], vms: [] })

    const { contextHolder: powerStateContextHolder, showErrorNotification } = useErrorNotification()

    const handlePowerState = async (record: VirtualMachine, op: ManageVirtualMachinePowerStateRequestPowerState) => {
        try {
            const request = {
                namespace: record.namespace,
                name: record.name,
                powerState: op,
            }
            await VirtualMachineManagement.ManageVirtualMachinePowerState(request)
            await sleep(1500)
            fetchData()
        } catch (err) {
            showErrorNotification('Operate virtual machine power', err)
        }
    }

    const rowSelection: TableRowSelection<VirtualMachine> = {
        columnWidth: 30,
        selectedRowKeys: selectedRow.keys,
        onChange: (keys: React.Key[]) => {
            const newSelectedRow: SelectedRow = { keys: [], vms: [] }
            keys.forEach(key => {
                const vm = data.find(v => namespaceNamed(v) === key)
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
            title: '名字',
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
            render: (_, vm) => {
                const status = vm.virtualMachine?.status?.printableStatus as string
                return (
                    <Badge
                        status={statusMap[status] || 'default'}
                        text={< Tooltip title={status} > {status}</Tooltip>}
                    />
                )
            }
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => {
                const info = getOperatingSystem(vm.virtualMachineDisk?.root?.metadata?.labels || {})
                return (
                    <Flex justify="flex-start" align="center">
                        <IconFont type={`icon-${info.family}`} className={styles.operatingSystemIcon} />
                        <Tooltip title={`${formatOSFamily(info.family)} ${info.version}`}>{formatOSFamily(info.family)}</Tooltip>
                    </Flex>
                )
            }
        },
        {
            key: 'ipv4',
            title: 'IPv4',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => {
                const interfaces = vm.virtualMachineInstance?.status?.interfaces || []
                let firstIP = interfaces[0]?.ipAddress
                let ips = interfaces.flatMap((iface: any) => iface.ipAddresses).join('\n')
                return (<Tooltip title={<span className={styles.ip}>{extractIPFromCIDR(ips)}</span>}>{extractIPFromCIDR(firstIP)}</Tooltip>)
            }
        },
        {
            key: 'cpu',
            title: '处理器',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => {
                let core = vm.virtualMachine?.spec?.template?.spec?.domain?.cpu?.cores
                core = core ? `${core} Core` : ''
                return (<Tooltip title={core}>{core}</Tooltip>)
            }
        },
        {
            key: 'memory',
            title: '内存',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => {
                const [value, unit] = formatMemory(vm.virtualMachine?.spec?.template?.spec?.domain?.resources?.requests?.memory)
                const mem = `${value} ${unit}`
                return (<Tooltip title={mem}>{mem}</Tooltip>)
            }
        },
        {
            key: 'node',
            title: '节点',
            ellipsis: {
                showTitle: false,
            },
            render: (_, vm) => {
                const value = vm.virtualMachineInstance?.status?.nodeName
                return (<Tooltip title={value}>{value}</Tooltip>)
            }
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
            render: (_, vm) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'power',
                        label: '电源',
                        children: [
                            {
                                key: 'start',
                                label: <span onClick={() => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.ON)}>启动</span>
                            },
                            {
                                key: 'restart',
                                label: <span onClick={() => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.UNSPECIFIED)}>重启</span>
                            },
                            {
                                key: 'stop',
                                label: <span onClick={() => handlePowerState(vm, ManageVirtualMachinePowerStateRequestPowerState.OFF)}>关机</span>
                            }
                        ]
                    },
                    {
                        key: 'divider-1',
                        type: 'divider'
                    },
                    {
                        key: 'bindlabel',
                        label: '绑定标签'
                    },
                    {
                        key: 'edit',
                        label: <span onClick={() => console.log(vm, 'edit')}>编辑</span>
                    },
                    {
                        key: 'divider-2',
                        type: 'divider'
                    },
                    {
                        key: 'delete',
                        danger: true,
                        label: <span onClick={() => console.log(vm, 'delete')}>删除</span>
                    }
                ]
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined className={fontStyles.f22} />
                    </Dropdown>
                )
            }
        }
    ]

    return (
        <Space direction="vertical" className={commonStyles.wFull}>
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
                    virtual
                    size="middle"
                    pagination={false}
                    rowSelection={rowSelection}
                    rowKey={(record) => namespaceNamed(record)}
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: 1200, y: 300 }}
                />
            </Spin>

            <div>{contextHolder}</div>
            <div>{powerStateContextHolder}</div>
        </Space>
    )
}

export default List
