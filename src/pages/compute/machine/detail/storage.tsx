import { ResourceType } from "@/clients/ts/types/types"
import { getErrorMessage } from "@/utils/utils"
import { App, Badge, Modal, Space, Table, TableProps } from "antd"
import { instances as labels } from '@/clients/ts/label/labels.gen'
import { LoadingOutlined, StopOutlined } from '@ant-design/icons'
import { getResourceName } from "@/clients/clients"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"
import { useEffect, useRef, useState } from "react"
import { VirtualMachineSummary, watchVirtualMachineSummary } from "@/clients/virtual-machine-summary"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { getVirtualMachine, manageVirtualMachinePowerState, updateVirtualMachine } from "@/clients/virtual-machine"
import { DataVolume } from "@/clients/data-volume"
import commonStyles from "@/common/styles/common.module.less"
import DataVolumeStatus from "@/components/datavolume-status"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const abortCtrl = useRef<AbortController>()
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<VirtualMachineSummary>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineSummary(ns, setSummary, setLoading, abortCtrl.current?.signal).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE_SUMMARY),
                description: getErrorMessage(err)
            })
        })
    }, [ns])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(ResourceType.VIRTUAL_MACHINE_SUMMARY))
        abortCtrl.current?.abort()
    })

    const simpleDataVolumes = () => {
        return summary?.status?.virtualMachine?.spec?.template?.spec?.volumes?.filter(volume => volume.dataVolume) || []
    }

    const handleMount = async (name: string) => {
        const vmNamespace = summary?.metadata!.namespace!
        const vmName = summary?.metadata!.name!
        try {
            const vm = await getVirtualMachine({ namespace: vmNamespace, name: vmName })
            vm.spec?.template?.spec?.domain?.devices?.disks?.push({
                name: name,
                disk: { bus: "virtio" }
            })
            await updateVirtualMachine(vm)
            await manageVirtualMachinePowerState({ namespace: vmNamespace, name: vmName }, VirtualMachinePowerStateRequest_PowerState.REBOOT)
        } catch (err: any) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    const handleUnmount = async (name: string) => {
        const vmNamespace = summary?.metadata!.namespace!
        const vmName = summary?.metadata!.name!

        Modal.confirm({
            title: "Unmount Disk?",
            content: `You are about to unmount the disk "${name}". Please confirm.`,
            okText: 'Confirm Unmount',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm = await getVirtualMachine({ namespace: vmNamespace, name: vmName })
                    if (vm.spec?.template?.spec?.domain.devices.disks) {
                        vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk) => disk.name !== name)
                    }
                    await updateVirtualMachine(vm)
                    await manageVirtualMachinePowerState({ namespace: vmNamespace, name: vmName }, VirtualMachinePowerStateRequest_PowerState.REBOOT)
                } catch (err: any) {
                    notification.error({
                        message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                        description: getErrorMessage(err)
                    })
                }
            }
        })
    }

    const handleRemove = async (name: string) => {
        const vmNamespace = summary?.metadata!.namespace!
        const vmName = summary?.metadata!.name!

        Modal.confirm({
            title: "Remove Disk?",
            content: `You are about to remove the disk "${name}". Please confirm.`,
            okText: 'Confirm Removal',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm = await getVirtualMachine({ namespace: vmNamespace, name: vmName })
                    if (vm.spec?.template?.spec?.domain.devices.disks) {
                        vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => disk.name !== name)
                    }
                    if (vm.spec?.template?.spec?.volumes) {
                        vm.spec.template.spec.volumes = vm.spec.template.spec.volumes.filter((disk: any) => disk.name !== name)
                    }
                    await updateVirtualMachine(vm)
                    await manageVirtualMachinePowerState({ namespace: vmNamespace, name: vmName }, VirtualMachinePowerStateRequest_PowerState.REBOOT)
                } catch (err: any) {
                    notification.error({
                        message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                        description: getErrorMessage(err)
                    })
                }
            }
        })
    }

    const columns: TableProps<{ name: string }>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, simple) => simple.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                if (!dv) {
                    return
                }
                if (!(summary?.status?.virtualMachine?.spec?.template?.spec?.domain?.devices?.disks?.find((item) => item.name === simple.name))) {
                    return <Badge status="warning" text="未挂载" />
                }
                return <DataVolumeStatus dv={dv as DataVolume} />
            }
        },
        {
            key: 'type',
            title: '类型',
            ellipsis: true,
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                if (!dv) {
                    return
                }
                const name = dv.metadata!.labels?.[labels.VinkOperatingSystem.name]
                return name && (name as string).length > 0 ? "系统盘" : "数据盘"
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                return dv?.spec?.pvc?.resources?.requests?.storage
            }
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                return dv?.spec?.pvc?.storageClassName
            }
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                return dv?.spec?.pvc?.accessModes?.[0]
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, simple) => {
                const dv = summary?.status?.dataVolumes?.find(item => item.metadata!.name === simple.name)
                if (dv?.metadata!.labels?.[labels.VinkOperatingSystem.name]) {
                    return <StopOutlined className={commonStyles["disable-color"]} />
                }

                const mounted = summary?.status?.virtualMachine?.spec?.template?.spec?.domain?.devices?.disks?.find((item) => item.name === simple.name)

                let content: JSX.Element
                if (mounted) {
                    content = <a className={commonStyles["warning-color"]} onClick={async () => handleMount(simple.name)}>卸载</a>
                } else {
                    content = <a onClick={async () => handleUnmount(simple.name)}>卸载</a>
                }

                return (
                    <Space>
                        {content}
                        <a className={commonStyles["warning-color"]} onClick={() => handleRemove(simple.name)}>
                            移除
                        </a>
                    </Space>
                )
            }
        }
    ]

    return (
        <Table
            size="middle"
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={simpleDataVolumes()}
            pagination={false}
        />
    )
}
