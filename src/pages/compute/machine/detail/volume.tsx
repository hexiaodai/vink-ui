import { ResourceType } from "@/apis/types/group_version"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { capacity, getErrorMessage } from "@/utils/utils"
import { App, Badge, Modal, Space, Table, TableProps } from "antd"
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"
import { LoadingOutlined, StopOutlined } from '@ant-design/icons'
import { dataVolumes, virtualMachine } from "@/utils/parse-summary"
import { clients, resourceTypeName } from "@/clients/clients"
import { NotificationInstance } from "antd/es/notification/interface"
import { extractNamespaceAndName } from "@/utils/k8s"
import commonStyles from "@/common/styles/common.module.less"

export default () => {
    const { notification } = App.useApp()

    const { resource: virtualMachineSummary, loading } = useWatchResourceInNamespaceName(ResourceType.VIRTUAL_MACHINE_SUMMARY)

    const columns = columnsFunc(virtualMachineSummary, notification)

    const simpleDataVolumes = () => {
        return virtualMachineSummary?.status?.virtualMachine.spec.template.spec.volumes.filter((volume: any) => {
            return volume.dataVolume
        })
    }

    return (
        <Table
            size="middle"
            loading={{ spinning: loading, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={simpleDataVolumes()}
            pagination={false}
        />
    )
}

const columnsFunc = (virtualMachineSummary: any, notification: NotificationInstance) => {
    if (!virtualMachineSummary) {
        return
    }

    const namespaceName = extractNamespaceAndName(virtualMachineSummary)

    const handleMount = async (name: string) => {
        try {
            const vm: any = await clients.getResource(ResourceType.VIRTUAL_MACHINE, namespaceName)
            vm.spec.template.spec.domain.devices.disks.push({
                name: name,
                disk: {
                    bus: "virtio"
                }
            })
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
        } catch (err: any) {
            notification.error({
                message: resourceTypeName.get(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
    }

    const handleUnmount = async (name: string) => {
        Modal.confirm({
            title: "Unmount Disk?",
            content: `You are about to unmount the disk "${name}". Please confirm.`,
            okText: 'Confirm Unmount',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm: any = await clients.getResource(ResourceType.VIRTUAL_MACHINE, namespaceName)
                    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => disk.name !== name)
                    await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
                } catch (err: any) {
                    notification.error({
                        message: resourceTypeName.get(ResourceType.VIRTUAL_MACHINE),
                        description: getErrorMessage(err)
                    })
                }
            }
        })
    }

    const handleRemove = async (name: string) => {
        Modal.confirm({
            title: "Remove Disk?",
            content: `You are about to remove the disk "${name}". Please confirm.`,
            okText: 'Confirm Removal',
            okType: 'danger',
            cancelText: 'Cancel',
            okButtonProps: { disabled: false },
            onOk: async () => {
                try {
                    const vm: any = await clients.getResource(ResourceType.VIRTUAL_MACHINE, namespaceName)
                    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => disk.name !== name)
                    vm.spec.template.spec.volumes = vm.spec.template.spec.volumes.filter((disk: any) => disk.name !== name)
                    await clients.updateResource(ResourceType.VIRTUAL_MACHINE, vm)
                } catch (err: any) {
                    notification.error({
                        message: resourceTypeName.get(ResourceType.VIRTUAL_MACHINE),
                        description: getErrorMessage(err)
                    })
                }
            }
        })
    }

    const columns: TableProps<any>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, simple) => simple.dataVolume.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary)?.find((item: any) => item.metadata.name === simple.dataVolume.name)
                if (!dv) {
                    return
                }
                if (!virtualMachine(virtualMachineSummary)?.spec.template.spec.domain.devices.disks.find((item: any) => item.name === simple.name)) {
                    return <Badge status="warning" text="未挂载" />
                }
                const displayStatus = parseFloat(dv.status.progress) === 100 ? dataVolumeStatusMap[dv.status.phase].text : dv.status.progress
                return <Badge status={dataVolumeStatusMap[dv.status.phase].badge} text={displayStatus} />
            }
        },
        {
            key: 'type',
            title: '类型',
            ellipsis: true,
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary, simple.dataVolume.name)
                if (!dv) {
                    return
                }
                const osname = dv.metadata?.labels[labels.VinkVirtualmachineOs.name]
                return osname && osname.length > 0 ? "系统盘" : "数据盘"
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary, simple.dataVolume.name)
                if (!dv) {
                    return
                }
                return capacity(dv)
            }
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary, simple.dataVolume.name)
                if (!dv) {
                    return
                }
                return dv.spec.pvc.storageClassName
            }
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary, simple.dataVolume.name)
                if (!dv) {
                    return
                }
                return dv.spec.pvc.accessModes[0]
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, simple) => {
                const dv = dataVolumes(virtualMachineSummary, simple.dataVolume.name)
                if (!dv) {
                    return
                }
                if (dv.metadata.labels && dv.metadata.labels[labels.VinkVirtualmachineOs.name]) {
                    return <StopOutlined className={commonStyles["disable-color"]} />
                }

                const mounted = virtualMachine(virtualMachineSummary)?.spec.template.spec.domain.devices.disks.find((item: any) => item.name === simple.name)

                return (
                    <Space>
                        <a className={mounted ? commonStyles["warning-color"] : ""} onClick={async () => {
                            if (mounted) {
                                handleUnmount(simple.name)
                            } else {
                                await handleMount(simple.name)
                            }
                        }}>
                            {mounted ? "卸载" : "挂载"}
                        </a>
                        <a className={commonStyles["warning-color"]} onClick={() => handleRemove(simple.name)}>
                            移除
                        </a>
                    </Space>
                )
            }
        }
    ]

    return columns
}
