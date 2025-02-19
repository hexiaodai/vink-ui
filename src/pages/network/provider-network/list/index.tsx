import { App, Button, Dropdown, MenuProps, Modal } from 'antd'
import { useState } from 'react'
import { calculateResourceAge } from '@/utils/utils'
import { EllipsisOutlined } from '@ant-design/icons'
import { ProviderNetwork } from '@/clients/provider-networks'
import { ResourceTable } from '@/components/resource-table'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { NavLink } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { delete2 } from '@/clients/clients'

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<ProviderNetwork>[] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, pn) => pn.metadata!.name
        },
        {
            key: 'age',
            title: 'Age',
            ellipsis: true,
            width: 90,
            render: (_, pn) => calculateResourceAge(pn)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, pn) => {
                const ns: NamespaceName = { namespace: "", name: pn.metadata.name! }
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
                                title: "Confirm deletion of ProviderNetwork",
                                content: `Are you sure you want to delete the VPC "${pn.metadata!.name}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.PROVIDER_NETWORK, { namespace: "", name: pn.metadata.name! }, undefined, notification)
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
            <ResourceTable<ProviderNetwork>
                tableKey="provider-network-list"
                resourceType={ResourceType.PROVIDER_NETWORK}
                columns={columns}
                toolbar={{
                    actions: [
                        <NavLink to='/network/provider-networks/create'><Button icon={<PlusOutlined />}>创建 Provider Network</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.PROVIDER_NETWORK}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
