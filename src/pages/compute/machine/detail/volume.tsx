import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { dataVolumeStatusMap } from "@/utils/resource-status"
import { capacity } from "@/utils/utils"
import { App, Badge, Modal, Space, Table, TableProps } from "antd"
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"
import { LoadingOutlined, StopOutlined } from '@ant-design/icons'
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import { dataVolumes, virtualMachine } from "@/utils/parse-summary"
import { clients } from "@/clients/clients"
import commonStyles from "@/common/styles/common.module.less"

export default () => {
    const { notification } = App.useApp()

    const namespaceName = useNamespaceFromURL()

    const { resource: virtualMachineSummary, loading } = useWatchResourceInNamespaceName(GroupVersionResourceEnum.VIRTUAL_MACHINE_INSTANCE_SUMMARY)

    const mount = async (name: string) => {
        try {
            const vm: any = await clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, namespaceName)
            vm.spec.template.spec.domain.devices.disks.push({
                name: name,
                disk: {
                    bus: "virtio"
                }
            })
            await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
        } catch (err: any) {
            notification.error({
                message: "挂载失败",
                description: err.message
            })
        }
    }

    const unmount = async (name: string) => {
        try {
            const vm: any = await clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, namespaceName)
            vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => disk.name !== name)
            await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
        } catch (err: any) {
            notification.error({
                message: "卸载失败",
                description: err.message
            })
        }
    }

    const remove = async (name: string) => {
        try {
            const vm: any = await clients.fetchResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, namespaceName)
            vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => disk.name !== name)
            vm.spec.template.spec.volumes = vm.spec.template.spec.volumes.filter((disk: any) => disk.name !== name)
            await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, vm)
        } catch (err: any) {
            notification.error({
                message: "移除失败",
                description: err.message
            })
        }
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
                const mounted = virtualMachine(virtualMachineSummary)?.spec.template.spec.domain.devices.disks.find((item: any) => item.name === simple.name)
                if (dv.metadata?.labels[labels.VinkVirtualmachineOs.name]) {
                    return <StopOutlined className={commonStyles["disable-color"]} />
                }

                return (
                    <Space>
                        <a className={mounted ? commonStyles["warning-color"] : ""} onClick={async () => {
                            if (mounted) {
                                Modal.confirm({
                                    title: "卸载磁盘？",
                                    content: `即将卸载 "${simple.name}" 磁盘，请确认。`,
                                    okText: '确认卸载',
                                    okType: 'danger',
                                    cancelText: '取消',
                                    okButtonProps: {
                                        disabled: false,
                                    },
                                    onOk: async () => {
                                        await unmount(simple.name)
                                    }
                                })
                            } else {
                                await mount(simple.name)
                            }
                        }}>
                            {mounted ? "卸载" : "挂载"}
                        </a>
                        <a className={commonStyles["warning-color"]} onClick={() => {
                            Modal.confirm({
                                title: "移除磁盘？",
                                content: `即将移除 "${simple.name}" 磁盘，请确认。`,
                                okText: '确认移除',
                                okType: 'danger',
                                cancelText: '取消',
                                okButtonProps: {
                                    disabled: false,
                                },
                                onOk: async () => {
                                    await remove(simple.name)
                                }
                            })
                        }}>
                            移除
                        </a>
                    </Space>
                )
            }
        }
    ]

    const simpleDataVolumes = (vmSummary: any) => {
        return vmSummary?.status?.virtualMachine.spec.template.spec.volumes.filter((volume: any) => {
            return volume.dataVolume
        })
    }

    return (
        <Table
            size="middle"
            loading={{ spinning: loading, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={simpleDataVolumes(virtualMachineSummary)}
            pagination={false}
        />
    )
}
