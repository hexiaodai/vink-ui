import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { extractNamespaceAndName, formatMemory, namespaceNameKey } from '@/utils/k8s'
import { Link, NavLink, Params } from 'react-router-dom'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { calcScroll, classNames, dataSource, formatTimestamp, generateMessage, getErrorMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { ResourceType } from '@/clients/ts/types/types'
import { clients, getPowerStateName, getResourceName } from '@/clients/clients'
import { useWatchResources } from '@/hooks/use-resource'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { rootDisk, virtualMachine, virtualMachineInstance, virtualMachineIPs } from '@/utils/parse-summary'
import { getNamespaceFieldSelector, simpleFieldSelector } from '@/utils/search'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import VirtualMachineStatus from '../components/status'
import Terminal from '@/components/terminal'
import OperatingSystem from '@/components/operating-system'
import VirtualMachineManagement from '../components/management'

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [scroll, setScroll] = useState(150 * 11)

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const searchRef = useRef<HTMLInputElement>()

    const [searchOption, setSearchOption] = useState<{ fieldPath: string, label: string, open: boolean }>(
        { fieldPath: "metadata.name*=", label: "Name", open: false }
    )
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelector: simpleFieldSelector([getNamespaceFieldSelector(namespace)])
    }))

    const { resources: virtualMachineSummarys, loading } = useWatchResources(ResourceType.VIRTUAL_MACHINE_SUMMARY, opts)

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    useEffect(() => {
        const inputElement = document.querySelector('input[name="search"]')
        if (inputElement) {
            searchRef.current = inputElement as HTMLInputElement
        }
    }, [])

    const handleBatchManageVirtualMachinePowerState = async (state: VirtualMachinePowerStateRequest_PowerState) => {
        const statusText = getPowerStateName(state)
        Modal.confirm({
            title: `Batch ${statusText} virtual machines?`,
            content: generateMessage(selectedRows, `You are about to ${statusText} the "{names}" virtual machines. Please confirm.`, `You are about to ${statusText} {count} virtual machines, including "{names}". Please confirm.`),
            okText: `Confirm ${statusText}`,
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchManageVirtualMachinePowerState(selectedRows, state).catch(err => {
                    notification.error({
                        message: `Failed to batch ${statusText} virtual machines`,
                        description: getErrorMessage(err)
                    })
                })
            }
        })
    }

    const handleBatchDeleteVirtualMachines = async () => {
        const resourceName = getResourceName(ResourceType.VIRTUAL_MACHINE)
        Modal.confirm({
            title: `Batch delete ${resourceName}?`,
            content: generateMessage(selectedRows, `You are about to delete the following ${resourceName}: "{names}", please confirm.`, `You are about to delete the following ${resourceName}: "{names}" and {count} others, please confirm.`),
            okText: 'Confirm Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                clients.batchDeleteResources(ResourceType.VIRTUAL_MACHINE, selectedRows).catch(err => {
                    notification.error({
                        message: `Batch delete of ${resourceName} failed`,
                        description: getErrorMessage(err)
                    })
                })
            }
        })
    }

    return (
        <ProTable<any, Params>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
            scroll={{ x: scroll }}
            rowSelection={{
                onChange: (_, selectedRows) => setSelectedRows(selectedRows)
            }}
            tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
                return (
                    <Space size={16}>
                        <span>已选 {selectedRowKeys.length} 项</span>
                        <a onClick={onCleanSelected}>取消选择</a>
                    </Space>
                )
            }}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a onClick={() => handleBatchManageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.ON)}>批量开机</a>
                        <a onClick={() => handleBatchManageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.REBOOT)}>批量重启</a>
                        <a onClick={() => handleBatchManageVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.OFF)}>批量关机</a>
                        <a className={commonStyles["warning-color"]} onClick={() => handleBatchDeleteVirtualMachines()}>批量删除</a>
                    </Space >
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined /> }}
            dataSource={dataSource(virtualMachineSummarys)}
            request={async (params) => {
                setOpts((prevOpts) => ({
                    ...prevOpts,
                    fieldSelector: simpleFieldSelector([
                        getNamespaceFieldSelector(namespace),
                        { fieldPath: searchOption.fieldPath, value: params.search || params.keyword }
                    ])
                }))
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'virtual-machine-list-table-columns',
                persistenceType: 'localStorage',
                onChange: (obj) => setScroll(calcScroll(obj))
            }}
            rowKey={(vm) => namespaceNameKey(vm)}
            search={false}
            options={{
                fullScreen: true,
                density: false,
                search: {
                    name: "search",
                    autoComplete: "off",
                    allowClear: true,
                    style: { width: 250 },
                    placeholder: `Search by ${searchOption.label}`,
                    onClick: () => setSearchOption((pre) => ({ ...pre, open: true })),
                    onBlur: () => requestAnimationFrame(() => setSearchOption((pre) => ({ ...pre, open: false }))),
                    onKeyDown: (_e) => setSearchOption((pre) => ({ ...pre, open: false })),
                    prefix: <Dropdown
                        align={{ offset: [-11, 5] }}
                        open={searchOption.open}
                        menu={{
                            items,
                            onClick: (e) => {
                                const clickedItem: any = items?.find((item: any) => item.key === e.key)
                                setSearchOption({ fieldPath: e.key, label: clickedItem.label, open: false })
                                searchRef.current?.focus()
                            }
                        }}
                    >
                        <span>{searchOption.label}：</span>
                    </Dropdown>
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/compute/machines/create'><Button icon={<PlusOutlined />}>创建虚拟机</Button></NavLink>
                ]
            }}
        />
    )
}

const items: MenuProps['items'] = [
    { key: 'metadata.name*=', label: "Name" },
    { key: 'status.virtualMachine.status.printableStatus=', label: 'Status' },
    { key: 'status.network.ips[*].spec.ipAddress*=', label: 'IP' },
    { key: 'status.virtualMachineInstance.status.nodeName*=', label: "Host" },
    { key: 'status.dataVolumes[*].metadata.labels.vink\\.kubevm\\.io/virtualmachine\\.os=', label: "OS" },
    { key: 'status.virtualMachineInstance.metadata.annotations.vink\\.kubevm\\.io/virtualmachineinstance\\.host*=', label: 'Host IP' }
]

const columns: ProColumns<any>[] = [
    {
        key: 'name',
        title: '名称',
        fixed: 'left',
        ellipsis: true,
        render: (_, summary) => <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${summary.metadata.namespace}&name=${summary.metadata.name}` }}>{summary.metadata.name}</Link>
    },
    {
        key: 'status',
        title: '状态',
        ellipsis: true,
        render: (_, summary) => <VirtualMachineStatus vm={virtualMachine(summary)} />
    },
    {
        key: 'console',
        title: '控制台',
        width: 90,
        render: (_, summary) => <Terminal vm={virtualMachine(summary)} />
    },
    {
        key: 'operatingSystem',
        title: '操作系统',
        ellipsis: true,
        render: (_, summary) => {
            return <OperatingSystem dv={rootDisk(summary)} />
        }
    },
    {
        key: 'ipv4',
        title: 'IPv4',
        ellipsis: true,
        render: (_, summary) => {
            const ipObjs = virtualMachineIPs(summary)
            if (!ipObjs || ipObjs.length === 0) {
                return
            }

            const addrs: string[] = []
            for (const ipObj of ipObjs) {
                addrs.push(ipObj.spec.ipAddress)
            }

            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {addrs.map((element: any, index: any) => (
                        <Tag key={index} bordered={true}>
                            {element}
                        </Tag>
                    ))}
                </Flex>
            )

            return (
                <Popover content={content}>
                    <Tag bordered={true}>{addrs[0]}</Tag>
                    +{addrs.length}
                </Popover>
            )
        }
    },
    {
        key: 'cpu',
        title: '处理器',
        ellipsis: true,
        render: (_, summary) => {
            const vm = virtualMachine(summary)
            let core = vm.spec.template?.spec?.domain?.cpu?.cores || vm.spec.template?.spec?.resources?.requests?.cpu
            return core ? `${core} Core` : ''
        }
    },
    {
        key: 'memory',
        title: '内存',
        ellipsis: true,
        render: (_, summary) => {
            const vm = virtualMachine(summary)
            const mem = vm.spec.template?.spec?.domain?.memory?.guest || vm.spec.template?.spec?.domain?.resources?.requests?.memory
            const [value, unit] = formatMemory(mem)
            return `${value} ${unit}`
        }
    },
    {
        key: 'node',
        title: '节点',
        ellipsis: true,
        render: (_, summary) => virtualMachineInstance(summary)?.status?.nodeName
    },
    {
        key: 'nodeIP',
        title: '节点 IP',
        ellipsis: true,
        render: (_, summary) => {
            const vmi = virtualMachineInstance(summary)
            if (!vmi || !vmi.metadata.annotations) {
                return
            }

            const ipsAnnoVale = vmi.metadata.annotations[annotations.VinkVirtualmachineinstanceHost.name]
            if (!ipsAnnoVale || ipsAnnoVale.length == 0) {
                return
            }

            const ips = JSON.parse(ipsAnnoVale)
            if (!ips || ips.length === 0) {
                return
            }

            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {ips.map((element: any, index: any) => (
                        <Tag key={index} bordered={true}>
                            {element}
                        </Tag>
                    ))}
                </Flex>
            )

            return (
                <Popover content={content}>
                    <Tag bordered={true}>{ips[0]}</Tag>
                    +{ips.length}
                </Popover>
            )
        }
    },
    {
        key: 'created',
        title: '创建时间',
        width: 160,
        ellipsis: true,
        render: (_, summary) => formatTimestamp(summary.metadata.creationTimestamp)
    },
    {
        key: 'action',
        title: '操作',
        fixed: 'right',
        width: 90,
        align: 'center',
        render: (_, summary) => <VirtualMachineManagement type="list" namespace={extractNamespaceAndName(summary)} />
    }
]
