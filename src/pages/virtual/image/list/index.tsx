import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { namespaceNameKey } from '@/utils/k8s'
import { NavLink } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { calculateAge } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { replaceDots } from '@/utils/search'
import { EllipsisOutlined } from '@ant-design/icons'
import { ResourceTable } from '@/components/resource-table'
import { DataVolume } from '@/clients/data-volume'
import { useState } from 'react'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import type { ProColumns } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import DataVolumeStatus from '@/components/datavolume-status'
import { delete2 } from '@/clients/clients'

const dvImageTypeSelector = { fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "=", values: ["image"] }

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<DataVolume>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => dv.metadata!.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <DataVolumeStatus dv={dv} />
        },
        {
            key: 'operatingSystem',
            title: '操作系统',
            ellipsis: true,
            render: (_, dv) => {
                return <OperatingSystem dv={dv} />
            }
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec?.pvc?.resources?.requests?.storage
        },
        {
            key: 'age',
            title: 'Age',
            ellipsis: true,
            width: 90,
            render: (_, dv) => calculateAge(dv.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, dv) => {
                const nn = { namespace: dv.metadata!.namespace, name: dv.metadata!.name }
                const items: MenuProps['items'] = [
                    {
                        key: 'yaml',
                        label: 'YAML',
                        onClick: () => setYamlDetail({ open: true, nn: nn })
                    },
                    {
                        key: 'divider-1',
                        type: 'divider'
                    },
                    {
                        key: 'delete',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "Confirm deletion of operating system image",
                                content: `Are you sure you want to delete the operating system image "${namespaceNameKey(nn)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.DATA_VOLUME, nn, undefined, notification)
                                }
                            })
                        },
                        label: "删除"
                    }
                ]
                return (
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <EllipsisOutlined />
                    </Dropdown>
                )
            }
        }
    ]

    const close = () => {
        setYamlDetail({ open: false, nn: undefined })
    }

    return (
        <>
            <ResourceTable<DataVolume>
                tableKey="image-list"
                resourceType={ResourceType.DATA_VOLUME}
                columns={columns}
                defaultSelecoters={[dvImageTypeSelector]}
                toolbar={{
                    actions: [
                        <NavLink to='/virtual/images/create'><Button icon={<PlusOutlined />}>添加镜像</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.DATA_VOLUME}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
