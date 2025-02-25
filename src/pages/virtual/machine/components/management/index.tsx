import { VirtualMachinePowerStateRequest_PowerState } from '@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { openConsole } from '@/utils/utils'
import { App, Button, Dropdown, Input, MenuProps, Modal, Popconfirm, Spin } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useRef, useState } from 'react'
import { DataDiskDrawer } from '../data-disk-drawer'
import { NetworkDrawer } from '../network-drawer'
import { generateDataDisks, generateNetwork } from '../../../virtualmachine'
import { namespaceNameString } from '@/utils/k8s'
import { LoadingOutlined } from '@ant-design/icons'
import { manageVirtualMachinePowerState, VirtualMachine } from '@/clients/virtual-machine'
import { DataVolume } from '@/clients/data-volume'
import { createSnapshot, VirtualMachineSnapshot } from '@/clients/virtual-machine-snapshot'
import { VirtualMachineClone } from '@/clients/virtual-machine-clone'
import { VirtualMachineNetwork } from '@/clients/ts/types/virtualmachine'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { create, delete2, get, update } from '@/clients/clients'

interface Props {
    nn: NamespaceName
    type: "list" | "detail"
}

const VirtualMachineManagement: React.FC<Props> = ({ nn, type }) => {
    const { notification } = App.useApp()

    const [loading, setLoading] = useState<boolean>(false)

    const [openDrawer, setOpenDrawer] = useState({ dataDisk: false, network: false, clone: false })

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const [virtualMachine, setVirtualMachine] = useState<VirtualMachine>()

    const [popupVisible, setPopupVisible] = useState(false)

    const cloneNameRef = useRef<string>()

    let content = <EllipsisOutlined />
    if (type === "detail") {
        content = <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
    }

    const items: MenuProps['items'] = [
        {
            key: 'console',
            label: '打开控制台',
            onClick: () => {
                if (virtualMachine) openConsole(virtualMachine)
            },
            disabled: virtualMachine?.status?.printableStatus !== "Running"
        },
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: async () => await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.ON, undefined, notification),
                    label: "启动",
                    disabled: virtualMachine?.status?.printableStatus === "Running"
                },
                {
                    key: 'restart',
                    onClick: async () => await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification),
                    label: "重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'stop',
                    onClick: async () => await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.OFF, undefined, notification),
                    label: "关机",
                    disabled: virtualMachine?.status?.printableStatus === "Stopped"
                },
                {
                    key: 'force-restart',
                    onClick: async () => await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, undefined, notification),
                    label: "强制重启",
                    disabled: virtualMachine?.status?.printableStatus !== "Running"
                },
                {
                    key: 'force-stop',
                    onClick: async () => await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, undefined, notification),
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
            key: 'disk',
            label: "添加磁盘",
            onClick: () => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: true }))
        },
        {
            key: 'network',
            label: "添加网络",
            onClick: () => setOpenDrawer((prevState) => ({ ...prevState, network: true }))
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'clone',
            label: "克隆",
            onClick: async () => setOpenDrawer((prevState) => ({ ...prevState, clone: true }))
        },
        {
            key: 'snapshot',
            label: "创建快照",
            onClick: async () => { await createSnapshot(newSnapshot(nn), undefined, undefined, notification) }
        },
        {
            key: 'migration',
            label: "迁移",
            onClick: () => { }
        },
        {
            key: 'divider-3',
            type: 'divider'
        },
        {
            key: 'yaml',
            label: 'YAML',
            onClick: () => setYamlDetail({ open: true, nn: nn })
        },
        {
            key: 'divider-4',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => {
                Modal.confirm({
                    title: `Confirm deletion of virtual machine`,
                    content: `Are you sure you want to delete the virtual machine "${namespaceNameString(nn)}"? This action cannot be undone.`,
                    okText: "Delete",
                    okType: "danger",
                    cancelText: "Cancel",
                    onOk: async () => {
                        await delete2(ResourceType.VIRTUAL_MACHINE, nn, undefined, notification)
                    }
                })
            },
            label: "删除"
        }
    ]

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} delay={200}>
            <Popconfirm
                title="配置已更新，是否立即重启虚拟机？"
                open={popupVisible}
                onConfirm={async () => {
                    await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
                    setPopupVisible(false)
                }}
                onCancel={() => setPopupVisible(false)}
                okText="立即重启"
                cancelText="稍后再说"
            >
                <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    onOpenChange={async (open) => {
                        if (open) {
                            await get<VirtualMachine>(ResourceType.VIRTUAL_MACHINE, nn, setVirtualMachine, setLoading, notification)
                        }
                    }}
                    overlayStyle={{ minWidth: 85 }}
                >
                    {content}
                </Dropdown>
            </Popconfirm>

            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}
                onConfirm={async (disks: DataVolume[]) => {
                    if (disks.length == 0 || !virtualMachine) return
                    generateDataDisks(virtualMachine, disks)
                    await update<VirtualMachine>(virtualMachine, undefined, undefined, notification)
                    setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
                    if (virtualMachine?.status?.printableStatus === "Running") {
                        setPopupVisible(true)
                    }
                }}
            />
            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={async (net: VirtualMachineNetwork) => {
                    if (!virtualMachine) return
                    generateNetwork(virtualMachine, net)
                    await update<VirtualMachine>(virtualMachine, undefined, undefined, notification)
                    setOpenDrawer((prevState) => ({ ...prevState, network: false }))
                    if (virtualMachine?.status?.printableStatus === "Running") {
                        setPopupVisible(true)
                    }
                }}
            />

            <Modal
                title="虚拟机名称"
                open={openDrawer.clone}
                maskClosable={false}
                onCancel={() => setOpenDrawer((prevState) => ({ ...prevState, clone: false }))}
                onOk={async () => {
                    if (!cloneNameRef.current) return
                    await create<VirtualMachineClone>(newClone(nn, cloneNameRef.current), undefined, undefined, notification)
                    setOpenDrawer((prevState) => ({ ...prevState, clone: false }))
                }}
            >
                <Input onChange={(e) => (cloneNameRef.current = e.target.value)} />
            </Modal>

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.VIRTUAL_MACHINE}
                namespaceName={yamlDetail.nn}
                onCancel={() => setYamlDetail({ open: false, nn: undefined })}
                onConfirm={() => {
                    setYamlDetail({ open: false, nn: undefined })
                    if (virtualMachine?.status?.printableStatus === "Running") {
                        setPopupVisible(true)
                    }
                }}
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

const newClone = (nn: NamespaceName, name: string): VirtualMachineClone => {
    const instance: VirtualMachineClone = {
        apiVersion: "clone.kubevirt.io/v1alpha1",
        // apiVersion: "clone.kubevirt.io/v1beta1",
        kind: "VirtualMachineClone",
        metadata: {
            generateName: `${nn.name}-clone-${name}`,
            namespace: nn.namespace
        },
        spec: {
            source: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: nn.name
            },
            target: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: name
            }
        }
    }
    return instance
}
