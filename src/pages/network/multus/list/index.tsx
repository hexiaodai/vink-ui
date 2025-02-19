import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { useState } from 'react'
import { calculateAge, getProvider } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { Multus } from '@/clients/multus'
import { namespaceNameKey } from '@/utils/k8s'
import { ResourceTable } from '@/components/resource-table'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { NavLink } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import { delete2 } from '@/clients/clients'
import type { ProColumns } from '@ant-design/pro-components'

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<Multus>[] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, mc) => mc.metadata!.name
        },
        {
            key: 'provider',
            title: 'Provider',
            ellipsis: true,
            render: (_, mc) => getProvider(mc)
        },
        {
            key: 'age',
            title: 'Age',
            width: 90,
            ellipsis: true,
            render: (_, mc) => calculateAge(mc.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, mc) => {
                const ns: NamespaceName = { namespace: mc.metadata!.namespace, name: mc.metadata!.name }
                const items: MenuProps['items'] = [
                    {
                        key: 'yaml',
                        label: 'YAML',
                        onClick: () => setYamlDetail({ open: true, nn: ns })
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
                                title: "Confirm deletion of multus",
                                content: `Are you sure you want to delete the multus "${namespaceNameKey(ns)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.MULTUS, ns, undefined, notification)
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
            <ResourceTable<Multus>
                tableKey="multus-list"
                resourceType={ResourceType.MULTUS}
                columns={columns}
                toolbar={{
                    actions: [
                        <NavLink to='/network/multus/create'><Button icon={<PlusOutlined />}>创建 Multus</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.MULTUS}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
