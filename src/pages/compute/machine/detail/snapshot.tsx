import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons'
import { App, Dropdown, MenuProps, Modal, Table } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { calculateAge } from '@/utils/utils'
import { NamespaceName } from '@/clients/ts/types/types'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { deleteSnapshot, VirtualMachineSnapshot, watchVirtualMachineSnapshots } from '@/clients/virtual-machine-snapshot'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { createRestore, deleteRestore, listVirtualMachineRestores, VirtualMachineRestore, watchVirtualMachineRestores } from '@/clients/virtual-machine-restore'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import { TableProps } from 'antd/lib'
import { extractNamespaceAndName, namespaceNameKey } from '@/utils/k8s'
import useUnmount from '@/hooks/use-unmount'

const fieldPathRef = (ns: NamespaceName, type: "snapshot" | "restore") => {
    const fieldName = type === "snapshot" ? "source" : "target"
    return [
        { fieldPath: "metadata.namespace", operator: "=", values: [ns.namespace] },
        { fieldPath: `spec.${fieldName}.apiGroup`, operator: "=", values: ["kubevirt.io"] },
        { fieldPath: `spec.${fieldName}.kind`, operator: "=", values: ["VirtualMachine"] },
        { fieldPath: `spec.${fieldName}.name`, operator: "=", values: [ns.name] }
    ]
}

export default () => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<VirtualMachineSnapshot[]>()

    const abortCtrl = useRef<AbortController>()

    const optsRef = useRef<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: fieldPathRef(ns, "snapshot") }
    }))

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineSnapshots(setResources, setLoading, abortCtrl.current.signal, optsRef.current, notification)
    }, [])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([])
    const expandedRowRender = (snapshot: VirtualMachineSnapshot, _index: number, _indent: number, expanded: boolean) => {
        return <ExpandedRow snapshot={snapshot} expanded={expanded} />
    }
    const handleExpand = (expanded: boolean, snapshot: VirtualMachineSnapshot) => {
        if (expanded) {
            setExpandedRowKeys([namespaceNameKey(snapshot)])
        } else {
            setExpandedRowKeys([])
        }
    }

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
            render: (_, snapshot) => {
                const readyType = snapshot.status?.conditions?.find(item => item.type === 'Ready')
                return readyType?.status === 'True' ? "Ready" : "Not Ready"
            }
        },
        {
            key: 'age',
            title: 'Age',
            width: 110,
            ellipsis: true,
            render: (_, snapshot) => calculateAge(snapshot.metadata.creationTimestamp!)
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
                        onClick: async () => {
                            await createRestore(newRestore(ns, snapshot), undefined, undefined, notification)
                        },
                        label: "从快照恢复"
                    },
                    {
                        key: 'delete',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "Confirm deletion of virtual machine snapshot",
                                content: `Are you sure you want to delete the virtual machine snapshot "${namespaceNameKey(snapshot)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await deleteSnapshot(extractNamespaceAndName(snapshot), undefined, notification)
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
        <Table<VirtualMachineSnapshot>
            size="middle"
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
            columns={columns}
            dataSource={resources}
            expandable={{ expandedRowRender, expandedRowKeys, onExpand: handleExpand }}
            pagination={false}
            rowKey={snapshot => namespaceNameKey(snapshot)}
        />
    )
}

const ExpandedRow = ({ snapshot, expanded }: { snapshot: VirtualMachineSnapshot, expanded: boolean }) => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<VirtualMachineRestore[]>()

    const optsRef = useRef<ListOptions>(ListOptions.create({
        fieldSelectorGroup: {
            operator: "&&", fieldSelectors: [
                ...fieldPathRef(ns, "restore"),
                { fieldPath: "spec.virtualMachineSnapshotName", operator: "=", values: [snapshot.metadata.name!] }
            ]
        }
    }))

    useEffect(() => {
        if (expanded) {
            listVirtualMachineRestores(setResources, optsRef.current, setLoading, notification)
        }
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
            render: (_, restore) => restore.status?.complete ? "Complete" : "Not Complete"
        },
        {
            key: 'age',
            title: 'Age',
            width: 110,
            ellipsis: true,
            render: (_, restore) => calculateAge(restore.metadata.creationTimestamp!)
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
                                content: `Are you sure you want to delete the virtual machine restore "${namespaceNameKey(restore)}"? This action cannot be undone.`,
                                okText: 'Delete',
                                okType: 'danger',
                                cancelText: 'Cancel',
                                onOk: async () => {
                                    await deleteRestore(extractNamespaceAndName(restore), undefined, notification)
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
            rowKey={restore => namespaceNameKey(restore)}
            pagination={false}
        />
    )
}

const newRestore = (vmns: NamespaceName, snapshot: VirtualMachineSnapshot): VirtualMachineRestore => {
    const instance: VirtualMachineRestore = {
        apiVersion: "snapshot.kubevirt.io/v1beta1",
        kind: "VirtualMachineRestore",
        metadata: {
            generateName: `${vmns.name}-${snapshot.metadata.name}-restore-`,
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
