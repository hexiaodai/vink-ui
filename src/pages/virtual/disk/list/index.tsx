import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Space, Tag } from 'antd'
import { namespaceNameKey } from '@/utils/k8s'
import { NavLink } from 'react-router-dom'
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { calculateAge } from '@/utils/utils'
import { FieldSelector, NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { annotationSelector, replaceDots } from '@/utils/search'
import { EllipsisOutlined } from '@ant-design/icons'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { DataVolume } from '@/clients/data-volume'
import { useState } from 'react'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { instances as annotations } from "@/clients/ts/annotation/annotations.gen"
import type { ProColumns } from '@ant-design/pro-components'
import DataVolumeStatus from '@/components/datavolume-status'
import { delete2 } from '@/clients/clients'

const dvDataTypeSelector = FieldSelector.create({ fieldPath: `metadata.labels.${replaceDots(labels.VinkDatavolumeType.name)}`, operator: "!=", values: ["image"] })

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: annotationSelector(annotations.VinkDatavolumeOwner.name), label: "Owner", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<DataVolume>[] = [
        {
            key: 'name',
            title: '名称',
            fixed: 'left',
            ellipsis: true,
            render: (_, dv) => {
                const osname = dv.metadata?.labels[labels.VinkOperatingSystem.name]
                return (
                    <Space size="small">
                        <span>{dv.metadata!.name}</span>
                        {(osname && osname.length > 0) ? <Tag color="default">系统盘</Tag> : null}
                    </Space>
                )
            }
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, dv) => <DataVolumeStatus dv={dv} />
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec?.pvc?.resources?.requests?.storage
        },
        {
            key: 'owner',
            title: 'Owner',
            ellipsis: true,
            render: (_, dv) => {
                const owners = dv.metadata!.annotations?.[annotations.VinkDatavolumeOwner.name]
                if (!owners) {
                    return
                }
                const parse: string[] = JSON.parse(owners)
                if (parse.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {parse.map((element: any, index: any) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{parse[0]}</Tag>
                        +{parse.length}
                    </Popover>
                )
            }
        },
        {
            title: '访问模式',
            key: 'accessModes',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes?.[0]
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
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
                                title: "Confirm deletion of disk",
                                content: `Are you sure you want to delete the disk "${namespaceNameKey(nn)}"? This action cannot be undone.`,
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

    return (
        <>
            <ResourceTable<DataVolume>
                tableKey="disk-list"
                resourceType={ResourceType.DATA_VOLUME}
                searchOptions={searchOptions}
                columns={columns}
                defaultSelecoters={[dvDataTypeSelector]}
                toolbar={{
                    actions: [
                        <NavLink to='/virtual/disks/create'><Button icon={<PlusOutlined />}>添加磁盘</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.DATA_VOLUME}
                namespaceName={yamlDetail.nn}
                onCancel={() => setYamlDetail({ open: false, nn: undefined })}
                onConfirm={() => setYamlDetail({ open: false, nn: undefined })}
            />
        </>
    )
}
