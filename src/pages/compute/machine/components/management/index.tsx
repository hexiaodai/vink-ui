import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { NamespaceName } from '@/clients/ts/types/types'
import { openConsole } from '@/utils/utils'
import { App, Button, Dropdown, MenuProps, Modal, Spin } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { DataDiskDrawer } from '../data-disk-drawer'
import { Link } from 'react-router-dom'
import { NetworkDrawer } from '../network-drawer'
import { generateDataDisks, generateNetwork } from '../../virtualmachine'
import { namespaceNameKey } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { deleteVirtualMachine, getVirtualMachine, manageVirtualMachinePowerState, updateVirtualMachine, VirtualMachine } from '@/clients/virtual-machine'
import { DataVolume } from '@/clients/data-volume'
import { VirtualMachineNetworkType } from '@/clients/subnet'
import { createSnapshot, VirtualMachineSnapshot } from '@/clients/virtual-machine-snapshot'
import { createClone, VirtualMachineClone } from '@/clients/virtual-machine-clone'

interface Props {
    namespace: NamespaceName
    type: "list" | "detail"
}

const VirtualMachineManagement: React.FC<Props> = ({ namespace, type }) => {
    const { notification } = App.useApp()

    const [loading, setLoading] = useState<boolean>(false)

    const [openDrawer, setOpenDrawer] = useState({ dataDisk: false, network: false })

    const [virtualMachine, setVirtualMachine] = useState<VirtualMachine>()

    let content = <EllipsisOutlined />
    if (type === "detail") {
        content = <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
    }

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            return
        }
        await getVirtualMachine(namespace, setVirtualMachine, setLoading, notification)
    }

    const handleConfirmDisk = async (disks: DataVolume[]) => {
        if (disks.length == 0 || !virtualMachine) {
            return
        }
        generateDataDisks(virtualMachine, disks)
        await updateVirtualMachine(virtualMachine)
        await manageVirtualMachinePowerState({ namespace: virtualMachine.metadata!.namespace, name: virtualMachine.metadata!.name }, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
        setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
    }

    const handleConfirmNetwork = async (net: VirtualMachineNetworkType) => {
        if (!virtualMachine) {
            return
        }
        generateNetwork(virtualMachine, net)
        await updateVirtualMachine(virtualMachine)
        await manageVirtualMachinePowerState({ namespace: virtualMachine.metadata!.namespace, name: virtualMachine.metadata!.name }, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
        setOpenDrawer((prevState) => ({ ...prevState, network: false }))
    }

    const handleVirtualMachinePowerState = async (state: VirtualMachinePowerStateRequest_PowerState) => {
        await manageVirtualMachinePowerState({ namespace: virtualMachine?.metadata!.namespace!, name: virtualMachine?.metadata!.name! }, state, undefined, notification)
    }

    const handleCreateSnapshot = async () => {
        await createSnapshot(newSnapshot(namespace), undefined, undefined, notification)
    }

    const handleCreateClone = async () => {
        await createClone(newClone(namespace), undefined, undefined, notification)
    }

    const handleDeleteVirtualMachine = () => {
        Modal.confirm({
            title: `Confirm deletion of virtual machine`,
            content: `Are you sure you want to delete the virtual machine "${namespaceNameKey(namespace)}"? This action cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                await deleteVirtualMachine({ namespace: virtualMachine?.metadata!.namespace!, name: virtualMachine?.metadata!.name! }, undefined, notification)
            }
        })
    }

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: async () => await handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.ON),
                    label: "启动",
                    disabled: virtualMachine?.status?.printableStatus === "Running"
                },
                {
                    key: 'restart',
                    onClick: async () => await handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.REBOOT),
                    label: "重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'stop',
                    onClick: async () => await handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.OFF),
                    label: "关机",
                    disabled: virtualMachine?.status?.printableStatus === "Stopped"
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: async () => await handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT),
                    label: "强制重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'force-stop',
                    onClick: async () => await handleVirtualMachinePowerState(VirtualMachinePowerStateRequest_PowerState.FORCE_OFF),
                    label: "强制关机",
                    disabled: virtualMachine?.status?.printableStatus === "Stopped"
                },
            ]
        },
        {
            key: 'divider-1',
            type: 'divider'
        },
        {
            key: 'console',
            label: '控制台',
            onClick: () => {
                if (virtualMachine) {
                    openConsole(virtualMachine)
                }
            },
            disabled: virtualMachine?.status?.printableStatus !== "Running"
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'disk',
            label: '磁盘',
            children: [
                {
                    key: 'disk-add',
                    onClick: () => { setOpenDrawer((prevState: any) => ({ ...prevState, dataDisk: true })) },
                    label: "新增磁盘"
                },
                {
                    key: 'disk-remove',
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine?.metadata?.namespace}&name=${virtualMachine?.metadata?.name}&active=Storage` }}>移除磁盘</Link>
                }
            ]
        },
        {
            key: 'divider-3',
            type: 'divider'
        },
        {
            key: 'network',
            label: '网络',
            children: [
                {
                    key: 'network-add',
                    onClick: () => { setOpenDrawer((prevState: any) => ({ ...prevState, network: true })) },
                    label: "新增网络"
                },
                {
                    key: 'network-remove',
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine?.metadata?.namespace}&name=${virtualMachine?.metadata?.name}&active=Network` }}>移除网络</Link>
                }
            ]
        },
        {
            key: 'divider-4',
            type: 'divider'
        },
        {
            key: 'snapshot',
            label: "快照",
            children: [
                {
                    key: 'create-snapshot',
                    onClick: () => handleCreateSnapshot(),
                    label: "创建快照"
                },
                {
                    key: 'snapshot-restore',
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine?.metadata?.namespace}&name=${virtualMachine?.metadata?.name}&active=Snapshot` }}>快照恢复</Link>
                }
            ]
        },
        {
            key: 'clone',
            label: "克隆",
            onClick: () => handleCreateClone()
        },
        {
            key: 'divider-5',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => handleDeleteVirtualMachine(),
            label: "删除"
        }
    ]

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} delay={200}>
            <Dropdown
                menu={{ items }}
                trigger={['click']}
                onOpenChange={handleOpenChange}
                overlayStyle={{ minWidth: 85 }}
            >
                {content}
            </Dropdown>

            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}
                onConfirm={handleConfirmDisk}
            />
            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={handleConfirmNetwork}
            />
        </Spin>
    )
}

export default VirtualMachineManagement


const newSnapshot = (vmns: NamespaceName): VirtualMachineSnapshot => {
    const instance: VirtualMachineSnapshot = {
        apiVersion: "snapshot.kubevirt.io/v1beta1",
        kind: "VirtualMachineSnapshot",
        metadata: {
            generateName: `${vmns.name}-snapshot-`,
            namespace: vmns.namespace
        },
        spec: {
            source: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: vmns.name
            }
        }
    }
    return instance
}

const newClone = (vmns: NamespaceName): VirtualMachineClone => {
    const instance: VirtualMachineClone = {
        apiVersion: "clone.kubevirt.io/v1alpha1",
        // apiVersion: "clone.kubevirt.io/v1beta1",
        kind: "VirtualMachineClone",
        metadata: {
            generateName: `${vmns.name}-clone-`,
            namespace: vmns.namespace
        },
        spec: {
            source: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: vmns.name
            },
            target: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: `${vmns.name}-clone`
            }
        }
    }
    return instance
}
