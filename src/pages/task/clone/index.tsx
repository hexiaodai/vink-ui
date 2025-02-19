import { App, Dropdown, MenuProps, Modal } from 'antd'
import { useState } from 'react'
import { calculateAge } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { EllipsisOutlined } from '@ant-design/icons'
import { VirtualMachineClone } from '@/clients/virtual-machine-clone'
import { FieldSelectorOption, ResourceTable } from '@/components/resource-table'
import { YamlDrawer } from '@/components/resource-yaml-drawer'
import DefaultStatus from '@/components/default-status'
import type { ProColumns } from '@ant-design/pro-components'
import { delete2 } from '@/clients/clients'

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "spec.source.name", label: "源虚拟机", operator: "*=" },
    { fieldPath: "spec.target.name", label: "目标虚拟机", operator: "*=" }
]

export default () => {
    const { notification } = App.useApp()

    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<VirtualMachineClone>[] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, clone) => clone.metadata.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, clone) => <DefaultStatus crd={clone} />
        },
        {
            key: 'source',
            title: '源虚拟机',
            ellipsis: true,
            render: (_, clone) => clone.spec?.source.name
        },
        {
            key: 'target',
            title: '目标虚拟机',
            ellipsis: true,
            render: (_, clone) => clone.spec?.target.name
        },
        {
            key: 'age',
            title: 'Age',
            width: 90,
            ellipsis: true,
            render: (_, clone) => calculateAge(clone.metadata.creationTimestamp!)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, clone) => {
                const ns: NamespaceName = { namespace: clone.metadata!.namespace!, name: clone.metadata!.name! }
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
                                title: "Confirm deletion of VirtualMachineClone",
                                content: `Are you sure you want to delete the VirtualMachineClone "${ns.name}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.VIRTUAL_MACHINE_CLONE, ns, undefined, notification)
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
            <ResourceTable<VirtualMachineClone>
                tableKey="virtual-machine-clone-list"
                resourceType={ResourceType.VIRTUAL_MACHINE_CLONE}
                searchOptions={searchOptions}
                columns={columns}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.VIRTUAL_MACHINE_CLONE}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
