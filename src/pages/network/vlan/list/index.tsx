import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { calculateAge } from '@/utils/utils'
import { EllipsisOutlined } from '@ant-design/icons'
import { VLAN } from '@/clients/vlan'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import type { ProColumns } from '@ant-design/pro-components'
import { delete2 } from '@/clients/clients'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: "spec.id", label: "VLAN ID", operator: "=" },
    { fieldPath: "spec.provider", label: "Provider", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<VLAN>[] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, vlan) => vlan.metadata.name
        },
        {
            key: 'vlanID',
            title: 'VLAN ID',
            ellipsis: true,
            render: (_, vlan) => vlan.spec?.id
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, vlan) => vlan.spec?.provider
        },
        {
            key: 'age',
            title: 'Age',
            ellipsis: true,
            width: 90,
            render: (_, vlan) => calculateAge(vlan.metadata.creationTimestamp!)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, vlan) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'yaml',
                        label: 'YAML',
                        onClick: () => setYamlDetail({ open: true, nn: { namespace: "", name: vlan.metadata?.name! } })
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
                                title: "Confirm deletion of VLAN",
                                content: `Are you sure you want to delete the VPC "${vlan.metadata.name}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.VLAN, { namespace: "", name: vlan.metadata.name! }, undefined, notification)
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
            <ResourceTable<VLAN>
                tableKey="vlan-list"
                resourceType={ResourceType.VLAN}
                searchOptions={searchOptions}
                columns={columns}
                toolbar={{
                    actions: [
                        <NavLink to='/network/vlans/create'><Button icon={<PlusOutlined />}>创建 VLAN</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.VLAN}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
