import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Flex, Modal, Popover, Space, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { filterNullish, formatTimestamp, generateMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { getPowerStateName, getResourceName } from '@/clients/clients'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { rootDisk } from '@/utils/parse-summary'
import { getNamespaceFieldSelector, replaceDots } from '@/utils/search'
import { CustomTable, SearchItem } from '@/components/custom-table'
import { deleteVirtualMachines, manageVirtualMachinesPowerState, VirtualMachine } from '@/clients/virtual-machine'
import { VirtualMachineSummary, watchVirtualMachineSummarys } from '@/clients/virtual-machine-summary'
import { DataVolume } from '@/clients/data-volume'
import type { ProColumns } from '@ant-design/pro-components'
import commonStyles from '@/common/styles/common.module.less'
import VirtualMachineStatus from '../components/status'
import Terminal from '@/components/terminal'
import OperatingSystem from '@/components/operating-system'
import VirtualMachineManagement from '../components/management'
import useUnmount from '@/hooks/use-unmount'

const searchItems: SearchItem[] = [
    { fieldPath: "metadata.name", name: "Name", operator: "*=" },
    {
        fieldPath: "status.virtualMachine.status.printableStatus", name: "Status",
        items: [
            { inputValue: "Running", values: ["Running"], operator: '=' },
            { inputValue: "Stopped", values: ["Stopped", "Paused"], operator: '~=' },
            { inputValue: "Failed", values: ["CrashLoopBackOff", "ErrorUnschedulable", "ErrImagePull", "ImagePullBackOff", "ErrorPvcNotFound", "Unknown"], operator: '~=' },
            { inputValue: 'Provisioning', values: ["Provisioning", "Starting", "Stopping", "Terminating", "Migrating", "WaitingForVolumeBinding"], operator: '~=' },
        ]
    },
    {
        fieldPath: `status.dataVolumes[*].metadata.labels.${replaceDots("vink.kubevm.io/virtualmachine.os")}`, name: "OS",
        items: [
            { inputValue: "Ubuntu", values: ["Ubuntu"], operator: '=' },
            { inputValue: "CentOS", values: ["CentOS"], operator: '=' },
            { inputValue: "Debian", values: ["Debian"], operator: '=' },
            { inputValue: "Linux", values: ["Linux", "Ubuntu", "CentOS", "Debian"], operator: '~=' },
            { inputValue: "Windows", values: ["Windows"], operator: '=' },
        ]
    },
    { fieldPath: "status.network.ips[*].spec.ipAddress", name: "IP", operator: "*=" },
    { fieldPath: "status.virtualMachineInstance.status.nodeName", name: "Host Name", operator: "*=" },
    { fieldPath: `status.virtualMachineInstance.metadata.annotations.${replaceDots("vink.kubevm.io/virtualmachineinstance.host")}`, name: "Host IP", operator: "*=" }
]

const columns: ProColumns<VirtualMachineSummary>[] = [
    {
        key: 'name',
        title: '名称',
        fixed: 'left',
        ellipsis: true,
        render: (_, summary) => {
            return <Link to={{
                pathname: "/compute/machines/detail",
                search: `namespace=${summary.metadata!.namespace}&name=${summary.metadata!.name}`
            }}>
                {summary.metadata!.name}
            </Link>
        }
    },
    {
        key: 'status',
        title: '状态',
        ellipsis: true,
        render: (_, summary) => {
            const vm = summary.status?.virtualMachine
            if (!vm) {
                return
            }
            return <VirtualMachineStatus vm={vm as VirtualMachine} />
        }
    },
    {
        key: 'console',
        title: '控制台',
        width: 90,
        render: (_, summary) => {
            const vm = summary.status?.virtualMachine
            if (!vm) {
                return
            }
            return <Terminal vm={vm as VirtualMachine} />
        }
    },
    {
        key: 'operatingSystem',
        title: '操作系统',
        ellipsis: true,
        render: (_, summary) => {
            const disk = rootDisk(summary)
            if (!disk) {
                return
            }
            return <OperatingSystem dv={disk as DataVolume} />
        }
    },
    {
        key: 'ipv4',
        title: 'IPv4',
        ellipsis: true,
        render: (_, summary) => {
            const ips = summary.status?.network?.ips
            if (!ips) {
                return
            }

            const addrs: string[] = []
            for (const ip of ips) {
                const addr = ip.spec?.ipAddress
                if (addr) {
                    addrs.push(addr)
                }
            }
            if (addrs.length === 0) {
                return
            }

            const content = (
                <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                    {addrs.map((element, index) => (
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
            const vm = summary.status?.virtualMachine
            if (!vm) {
                return
            }
            let core = vm.spec?.template?.spec?.domain?.cpu?.cores || vm.spec?.template?.spec?.domain?.resources?.requests?.cpu
            if (!core) {
                return
            }
            return `${core} Core`
        }
    },
    {
        key: 'memory',
        title: '内存',
        ellipsis: true,
        render: (_, summary) => {
            const vm = summary.status?.virtualMachine
            if (!vm) {
                return
            }
            return vm.spec?.template?.spec?.domain?.memory?.guest || vm.spec?.template?.spec?.domain?.resources?.requests?.memory
        }
    },
    {
        key: 'node',
        title: '节点',
        ellipsis: true,
        render: (_, summary) => summary.status?.virtualMachineInstance?.status?.nodeName
    },
    {
        key: 'nodeIP',
        title: '节点 IP',
        ellipsis: true,
        render: (_, summary) => {
            const vmi = summary.status?.virtualMachineInstance
            if (!vmi) {
                return
            }

            const ipsAnnoVale = vmi.metadata!.annotations?.[annotations.VinkHost.name] as string
            if (!ipsAnnoVale || ipsAnnoVale.length === 0) {
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
        render: (_, summary) => formatTimestamp(summary.metadata!.creationTimestamp)
    },
    {
        key: 'action',
        title: '操作',
        fixed: 'right',
        width: 90,
        align: 'center',
        render: (_, summary) => <VirtualMachineManagement type="list" namespace={{ namespace: summary.metadata!.namespace, name: summary.metadata!.name }} />
    }
]

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [selectedRows, setSelectedRows] = useState<VirtualMachineSummary[]>()

    const [defaultFieldSelectors, setDefaultFieldSelectors] = useState<FieldSelector[]>(filterNullish([getNamespaceFieldSelector(namespace)]))
    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: defaultFieldSelectors }
    }))

    useEffect(() => {
        setDefaultFieldSelectors(filterNullish([getNamespaceFieldSelector(namespace)]))
    }, [namespace])

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<VirtualMachineSummary[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineSummarys(setResources, setLoading, abortCtrl.current.signal, opts, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleManageVirtualMachinesPowerState = async (state: VirtualMachinePowerStateRequest_PowerState) => {
        const vms = selectedRows?.map(item => item.status?.virtualMachine as VirtualMachine).filter(Boolean)
        if (!vms || vms.length === 0) {
            return
        }
        const statusText = getPowerStateName(state)
        Modal.confirm({
            title: `Confirm batch "${statusText}" operation`,
            content: `Are you sure you want to "${statusText}" the selected virtual machines?`,
            okText: `${statusText}`,
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await manageVirtualMachinesPowerState(vms, state)
            }
        })
    }

    const handleDeleteVirtualMachines = async () => {
        const vms = selectedRows?.map(item => item.status?.virtualMachine as VirtualMachine).filter(Boolean)
        if (!vms || vms.length === 0) {
            return
        }
        Modal.confirm({
            title: `Confirm batch deletion of virtual machines`,
            content: `Are you sure you want to delete the selected virtual machines? This action cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                await deleteVirtualMachines(vms, undefined, notification)
            }
        })
    }

    return (
        <CustomTable<VirtualMachineSummary>
            searchItems={searchItems}
            loading={loading}
            updateWatchOptions={setOpts}
            onSelectRows={(rows) => setSelectedRows(rows)}
            defaultFieldSelectors={defaultFieldSelectors}
            key="virtual-machine-list-table-columns"
            columns={columns}
            dataSource={resources}
            toolbar={{
                actions: [
                    <NavLink to='/compute/machines/create'><Button icon={<PlusOutlined />}>创建虚拟机</Button></NavLink>
                ]
            }}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a onClick={() => handleManageVirtualMachinesPowerState(VirtualMachinePowerStateRequest_PowerState.ON)}>开机</a>
                        <a onClick={() => handleManageVirtualMachinesPowerState(VirtualMachinePowerStateRequest_PowerState.REBOOT)}>重启</a>
                        <a onClick={() => handleManageVirtualMachinesPowerState(VirtualMachinePowerStateRequest_PowerState.OFF)}>关机</a>
                        <a className={commonStyles["warning-color"]} onClick={() => handleDeleteVirtualMachines()}>删除</a>
                    </Space >
                )
            }}
        />
    )
}
