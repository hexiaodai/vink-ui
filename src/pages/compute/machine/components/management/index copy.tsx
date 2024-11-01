import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { clients } from '@/clients/clients'
import { manageVirtualMachinePowerState } from '@/clients/virtualmachine'
import { generateKubeovnNetworkAnnon, openConsole } from '@/utils/utils'
import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { NamespaceName } from '@/apis/types/namespace_name'
import { NotificationInstance } from 'antd/es/notification/interface'
import { DataDiskDrawer } from '../data-disk-drawer'
import { Link } from 'react-router-dom'
import { NetworkDrawer } from '../network-drawer'
import { NetworkConfig } from '../../vm'

interface Props {
    vm?: any
    namespace?: NamespaceName
    type: "list" | "detail"
}

const VirtualMachineManagement: React.FC<Props> = ({ vm, namespace, type }) => {
    if (!vm && !namespace) {
        return
    }

    const { notification } = App.useApp()

    const [openDrawer, setOpenDrawer] = useState({ dataDisk: false, network: false })
    const [virtualMachine, setVirtualMachine] = useState<any>(vm)

    const items = itemsFunc(virtualMachine, setOpenDrawer, notification)

    let content = <EllipsisOutlined />
    if (type === "detail") {
        content = <Button color="default" variant="filled" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
    }

    return (
        <>
            <Dropdown
                menu={{ items }}
                trigger={['click']}
                onOpenChange={(open) => handleOpen(open, setVirtualMachine, notification, namespace)}
                overlayStyle={{ minWidth: 85 }}
            >
                {content}
            </Dropdown>
            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}
                onConfirm={(disks) => {
                    if (disks.length == 0) {
                        return
                    }
                    addDiskToVirtualMachine(virtualMachine, disks, notification).then(() => {
                        setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
                    })
                }}
            />
            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={async (net) => {
                    try {
                        await addNetworkToVirtualMachine(virtualMachine, net)
                        setOpenDrawer((prevState) => ({ ...prevState, network: false }))
                        notification.success({ message: "添加网络成功" })
                    } catch (err: any) {
                        notification.error({ message: "添加网络失败", description: err instanceof Error ? err.message : String(err) })
                    }
                }}
            />
        </>
    )
}

const addDiskToVirtualMachine = async (vm: any, disks: any[], notification: NotificationInstance) => {
    disks.forEach(disk => {
        vm.spec.template.spec.volumes.push({ name: disk.metadata.name, dataVolume: { name: disk.metadata.name } })
        vm.spec.template.spec.domain.devices.disks.push({ name: disk.metadata.name, disk: { bus: "virtio" } })
    })

    const cloudinitVolIdx = vm.spec.template.spec.volumes.findIndex((vol: any) => vol.cloudInitNoCloud)
    if (cloudinitVolIdx > -1) {
        const [volume] = vm.spec.template.spec.volumes.splice(cloudinitVolIdx, 1)
        vm.spec.template.spec.volumes.push(volume)
    }

    try {
        await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
        notification.success({ message: "添加磁盘成功" })
    } catch (err: any) {
        notification.error({
            message: "添加磁盘失败",
            description: err.message
        })
    }
}

const addNetworkToVirtualMachine = async (vm: any, netcfg: NetworkConfig) => {
    const multusName = netcfg.multusCR.metadata.namespace + "/" + netcfg.multusCR.metadata.name
    for (const element of vm.spec.template.spec.networks) {
        if ((element.multus && element.multus.networkName == multusName) || (element.pod && vm.spec.template.metadata?.annotations["v1.multus-cni.io/default-network"] == multusName)) {
            throw new Error(`Network ${multusName} already exists in the virtual machine`)
        }
    }

    const map = new Map<string, boolean>()
    for (const element of vm.spec.template.spec.networks) {
        map.set(element.name, true)
    }

    let net: any
    for (let number = 1; ; number++) {
        const element = `net-${number}`
        if (map.has(element)) {
            continue
        }
        net = {
            name: element,
            multus: { networkName: multusName }
        }
        break
    }

    vm.spec.template.spec.networks.push(net)
    vm.spec.template.spec.domain.devices.interfaces.push({ name: net.name, [netcfg.interface]: {} })

    if (netcfg.ippool) {
        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multusCR, "ip_pool")] = netcfg.ippool.metadata.name
    }
    if (netcfg.ipAddress && netcfg.ipAddress.length > 0) {
        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multusCR, "ip_address")] = netcfg.ipAddress
    }
    if (netcfg.macAddress && netcfg.macAddress.length > 0) {
        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multusCR, "mac_address")] = netcfg.macAddress
    }

    vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multusCR, "logical_switch")] = netcfg.subnet.metadata.name

    await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
}

const statusEqual = (status: any, target: string) => {
    return status.printableStatus as string === target
}

const handleOpen = (open: boolean, setVirtualMachine: any, notification: NotificationInstance, ns?: NamespaceName,) => {
    if (!open || !ns) {
        return
    }
    clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, { namespace: ns.namespace, name: ns.name }).then((crd: any) => {
        setVirtualMachine(crd)
    }).catch((err: any) => {
        notification.error({
            message: "获取虚拟机失败",
            description: err.message
        })
    })
}

const itemsFunc = (virtualMachine: any, setOpenDrawer: any, notification: NotificationInstance) => {
    if (!virtualMachine) {
        return []
    }

    const items: MenuProps['items'] = [
        {
            key: 'power',
            label: '电源',
            children: [
                {
                    key: 'start',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.ON, notification),
                    label: "启动",
                    disabled: statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'restart',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.REBOOT, notification),
                    label: "重启",
                    disabled: !statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'stop',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.OFF, notification),
                    label: "关机",
                    disabled: statusEqual(virtualMachine.status, "Stopped")
                },
                {
                    key: 'power-divider-1',
                    type: 'divider'
                },
                {
                    key: 'force-restart',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, notification),
                    label: "强制重启",
                    disabled: !statusEqual(virtualMachine.status, "Running")
                },
                {
                    key: 'force-stop',
                    onClick: () => manageVirtualMachinePowerState(virtualMachine.metadata.namespace, virtualMachine.metadata.name, VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, notification),
                    label: "强制关机",
                    disabled: statusEqual(virtualMachine.status, "Stopped")
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
            onClick: () => openConsole(virtualMachine),
            disabled: !statusEqual(virtualMachine.status, "Running")
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'bindlabel',
            label: '绑定标签'
        },
        {
            key: 'divider-3',
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
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine.metadata.namespace}&name=${virtualMachine.metadata.name}&active=存储` }}>移除磁盘</Link>
                }
            ]
        },
        {
            key: 'divider-4',
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
                    label: <Link to={{ pathname: "/compute/machines/detail", search: `namespace=${virtualMachine.metadata.namespace}&name=${virtualMachine.metadata.name}&active=网络` }}>移除网络</Link>
                }
            ]
        },
        {
            key: 'divider-5',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => {
                Modal.confirm({
                    title: "删除虚拟机？",
                    content: `即将删除 "${virtualMachine.metadata.namespace}/${virtualMachine.metadata.name}" 虚拟机，请确认。`,
                    okText: '确认删除',
                    okType: 'danger',
                    cancelText: '取消',
                    okButtonProps: {
                        disabled: false,
                    },
                    onOk: async () => {
                        await clients.deleteResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, virtualMachine.metadata.namespace, virtualMachine.metadata.name, { notification: notification })
                    }
                })
            },
            label: "删除"
        }
    ]
    return items
}

export default VirtualMachineManagement
