import { formatTimestamp } from "@/utils/utils"
import { Button } from "antd"
import { useState } from "react"
import { Event } from "@/clients/event"
import { ProColumns } from "@ant-design/pro-components"
import { FieldSelectorOption, ResourceTable } from "@/components/resource-table"
import { FieldSelector, NamespaceName, ResourceType } from "@/clients/ts/types/types"
import { YamlDrawer } from "@/components/resource-yaml-drawer"

const defaultSelector: FieldSelector = FieldSelector.create({
    fieldPath: "involvedObject.kind",
    operator: "~=",
    values: ["VirtualMachine", "VirtualMachineInstance"]
})

const searchOptions: FieldSelectorOption[] = [
    { fieldPath: "involvedObject.name", label: "虚拟机", operator: "*=" }
]

export default () => {
    const [yamlDetail, setYamlDetail] = useState<{ open: boolean, nn?: NamespaceName }>({ open: false })

    const columns: ProColumns<any>[] = [
        {
            title: '类型',
            key: 'type',
            ellipsis: true,
            render: (_, e) => e.type
        },
        {
            title: '虚拟机',
            key: 'name',
            ellipsis: true,
            render: (_, e) => e.involvedObject.name
        },
        {
            title: '来源',
            key: 'source',
            ellipsis: true,
            render: (_, e) => e.source.component
        },
        {
            title: '原因',
            key: 'reason',
            ellipsis: true,
            render: (_, e) => e.reason
        },
        {
            title: '消息',
            key: 'message',
            ellipsis: true,
            render: (_, e) => e.message
        },
        {
            title: '最后触发时间',
            key: 'lastTimestamp',
            ellipsis: true,
            width: 160,
            render: (_, e) => formatTimestamp(e.lastTimestamp)
        },
        {
            key: 'action',
            title: '操作',
            fixed: 'right',
            width: 90,
            align: 'center',
            render: (_, e) => <Button type='link' onClick={() => {
                setYamlDetail({ open: true, nn: { name: e.metadata.name, namespace: e.metadata.namespace } })
            }}>查看</Button>
        }
    ]

    const close = () => {
        setYamlDetail({ open: false, nn: undefined })
    }

    return (
        <>
            <ResourceTable<Event>
                tableKey="event-list"
                resourceType={ResourceType.EVENT}
                searchOptions={searchOptions}
                columns={columns}
                defaultSelecoters={[defaultSelector]}
            />

            <YamlDrawer
                open={yamlDetail.open}
                resourceType={ResourceType.EVENT}
                namespaceName={yamlDetail.nn}
                onCancel={close}
                onConfirm={close}
            />
        </>
    )
}
