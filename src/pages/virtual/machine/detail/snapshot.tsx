import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons'
import { App, Dropdown, MenuProps, Modal, Table } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { calculateResourceAge } from '@/utils/utils'
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { VirtualMachineSnapshot } from '@/clients/virtual-machine-snapshot'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { VirtualMachineRestore } from '@/clients/virtual-machine-restore'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import { TableProps } from 'antd/lib'
import { getNamespaceName, namespaceNameString } from '@/utils/k8s'
import { useWatchResource, useWatchResources } from '@/hooks/use-watch-resource'
import { create, delete2, list } from '@/clients/clients'
import { VirtualMachine } from '@/clients/virtual-machine'
import DefaultStatus from '@/components/default-status'

const fieldPathRef = (nn: NamespaceName, type: "snapshot" | "restore") => {
    const fieldName = type === "snapshot" ? "source" : "target"
    return [
        { fieldPath: "metadata.namespace", operator: "=", values: [nn.namespace] },
        { fieldPath: `spec.${fieldName}.apiGroup`, operator: "=", values: ["kubevirt.io"] },
        { fieldPath: `spec.${fieldName}.kind`, operator: "=", values: ["VirtualMachine"] },
        { fieldPath: `spec.${fieldName}.name`, operator: "=", values: [nn.name] }
    ]
}

export default () => {
    const { notification } = App.useApp()

    const nn = useNamespaceFromURL()

    const { resource: virtualmachine, loading: virtualmachineLoading } = useWatchResource<VirtualMachine>(ResourceType.VIRTUAL_MACHINE)

    const optsRef = useRef<WatchOptions>(WatchOptions.create({ fieldSelectorGroup: { operator: "&&", fieldSelectors: fieldPathRef(nn, "snapshot") } }))
    const { resources, loading } = useWatchResources<VirtualMachineSnapshot>(ResourceType.VIRTUAL_MACHINE_SNAPSHOT, optsRef.current)

    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>()

    const columns: TableProps<VirtualMachineSnapshot>['columns'] = [
        {
            key: 'name',
            title: '名称',
            ellipsis: true,
            render: (_, snapshot) => snapshot.metadata.name
        },
        {
            key: 'status',
            title: '状态',
            ellipsis: true,
            render: (_, snapshot) => <DefaultStatus crd={snapshot} />
        },
        {
            key: 'age',
            title: 'Age',
            width: 110,
            ellipsis: true,
            render: (_, snapshot) => calculateResourceAge(snapshot)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 110,
            align: 'center',
            render: (_, snapshot) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'restore',
                        disabled: (!virtualmachine || virtualmachine.status?.printableStatus === "Running"),
                        onClick: async () => {
                            await create<VirtualMachineRestore>(newRestore(nn, snapshot), undefined, undefined, notification)
                        },
                        label: "从快照恢复"
                    },
                    {
                        key: 'delete',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "Confirm deletion of virtual machine snapshot",
                                content: `Are you sure you want to delete the virtual machine snapshot "${namespaceNameString(snapshot)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => { await delete2(ResourceType.VIRTUAL_MACHINE_SNAPSHOT, getNamespaceName(snapshot), undefined, notification) }
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
        <Table<VirtualMachineSnapshot>
            size="middle"
            loading={{ spinning: loading || virtualmachineLoading, delay: 500, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={resources}
            expandable={{
                expandedRowRender: (snapshot: VirtualMachineSnapshot, _index: number, _indent: number, expanded: boolean) => {
                    return <ExpandedRow snapshot={snapshot} expanded={expanded} />
                },
                expandedRowKeys,
                onExpand: (expanded, snapshot) => {
                    if (expanded) {
                        setExpandedRowKeys([namespaceNameString(snapshot)])
                    } else {
                        setExpandedRowKeys(undefined)
                    }
                }
            }}
            pagination={false}
            rowKey={snapshot => namespaceNameString(snapshot)}
        />
    )
}

const ExpandedRow = ({ snapshot, expanded }: { snapshot: VirtualMachineSnapshot, expanded: boolean }) => {
    const { notification } = App.useApp()

    const nn = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<VirtualMachineRestore[]>()

    const optsRef = useRef<ListOptions>(ListOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: [...fieldPathRef(nn, "restore"), { fieldPath: "spec.virtualMachineSnapshotName", operator: "=", values: [snapshot.metadata.name!] }] }
    }))
    useEffect(() => {
        if (expanded) list<VirtualMachineRestore>(ResourceType.VIRTUAL_MACHINE_RESTORE, setResources, optsRef.current, setLoading, notification)
    }, [expanded])

    const columns: TableProps<VirtualMachineRestore>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, restore) => restore.metadata.name
        },
        {
            title: '状态',
            key: 'status',
            ellipsis: true,
            render: (_, restore) => <DefaultStatus crd={restore} />
        },
        {
            key: 'age',
            title: 'Age',
            width: 110,
            ellipsis: true,
            render: (_, restore) => calculateResourceAge(restore)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 110,
            align: 'center',
            render: (_, restore) => {
                const items: MenuProps['items'] = [
                    {
                        key: 'delete',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "Confirm deletion of virtual machine restore",
                                content: `Are you sure you want to delete the virtual machine restore "${namespaceNameString(restore)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await delete2(ResourceType.VIRTUAL_MACHINE_RESTORE, getNamespaceName(restore), undefined, notification)
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
        <Table
            size="small"
            columns={columns}
            dataSource={resources}
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
            rowKey={restore => namespaceNameString(restore)}
            pagination={false}
        />
    )
}

const newRestore = (vmns: NamespaceName, snapshot: VirtualMachineSnapshot): VirtualMachineRestore => {
    const instance: VirtualMachineRestore = {
        apiVersion: "snapshot.kubevirt.io/v1beta1",
        kind: "VirtualMachineRestore",
        metadata: {
            generateName: `${snapshot.metadata.name}-restore-`,
            namespace: vmns.namespace
        },
        spec: {
            target: {
                apiGroup: "kubevirt.io",
                kind: "VirtualMachine",
                name: vmns.name
            },
            virtualMachineSnapshotName: snapshot.metadata.name!
        }
    }
    return instance
}
