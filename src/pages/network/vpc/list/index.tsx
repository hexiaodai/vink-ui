import { App, Button, Dropdown, Flex, MenuProps, Modal, Popover, Tag } from 'antd'
import { useState } from 'react'
import { calculateAge } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { VPC } from '@/clients/vpc'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import { NavLink } from 'react-router-dom'
import { PlusOutlined } from '@ant-design/icons'
import type { ProColumns } from '@ant-design/pro-components'
import { delete2 } from '@/clients/clients'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "metadata.name", label: "名称", operator: "*=" },
    { fieldPath: "spec.namespaces[*]", label: "命名空间", operator: "*=" },
    { fieldPath: "status.subnets[*]", label: "子网", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<VPC>[] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, vpc) => vpc.metadata!.name
        },
        {
            key: 'namespace',
            title: '命名空间',
            ellipsis: true,
            render: (_, vpc) => {
                let nss = vpc.spec?.namespaces
                if (!nss || nss.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {nss.map((element, index) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{nss[0]}</Tag>
                        +{nss.length}
                    </Popover>
                )
            }
        },
        {
            key: 'subnet',
            title: '子网',
            ellipsis: true,
            render: (_, vpc) => {
                if (!vpc.status?.subnets || vpc.status.subnets.length === 0) {
                    return
                }

                const content = (
                    <Flex wrap gap="4px 0" style={{ maxWidth: 250 }}>
                        {vpc.status.subnets.map((element, index) => (
                            <Tag key={index} bordered={true}>
                                {element}
                            </Tag>
                        ))}
                    </Flex>
                )

                return (
                    <Popover content={content}>
                        <Tag bordered={true}>{vpc.status.subnets[0]}</Tag>
                        +{vpc.status.subnets.length}
                    </Popover>
                )
            }
        },
        {
            key: 'age',
            title: 'Age',
            ellipsis: true,
            width: 90,
            render: (_, vpc) => calculateAge(vpc.metadata!.creationTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, vpc) => {
                const ns: NamespaceName = { namespace: "", name: vpc.metadata!.name }
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
                                title: "Confirm deletion of VPC",
                                content: `Are you sure you want to delete the VPC "${ns.name}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.VPC, ns, undefined, notification)
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
            <ResourceTable<VPC>
                tableKey="vpc-list"
                resourceType={ResourceType.VPC}
                searchOptions={searchOptions}
                columns={columns}
                toolbar={{
                    actions: [
                        <NavLink to='/network/vpcs/create'><Button icon={<PlusOutlined />}>创建 VPC</Button></NavLink>
                    ]
                }}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.VPC}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
