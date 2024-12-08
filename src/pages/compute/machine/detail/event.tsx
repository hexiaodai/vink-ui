import { ResourceType } from "@/clients/ts/types/types"
import { classNames, dataSource, formatTimestamp } from "@/utils/utils"
import { Button, Drawer, Flex, Table, TableProps } from "antd"
import { useWatchResources } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { useRef, useState } from "react"
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import { namespaceNameKey } from "@/utils/k8s"
import { WatchOptions } from "@/clients/ts/management/resource/v1alpha1/watch"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

export default () => {
    const namespaceName = useNamespaceFromURL()

    const [open, setOpen] = useState(false)

    const [currentEventDetail, setCurrentEventDetail] = useState<any>()

    // FIXME: involvedObject.name^=virt-launcher-${namespaceName.name}-
    const optsRef = useRef<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: {
            operator: "&&",
            fieldSelectors: [
                {
                    fieldPath: "involvedObject.namespace",
                    operator: "=",
                    values: [namespaceName.namespace]
                },
                {
                    fieldPath: "involvedObject.kind",
                    operator: "~=",
                    values: ["VirtualMachine", "VirtualMachineInstance", "Pod"]
                },
                {
                    fieldPath: "involvedObject.name",
                    operator: "=",
                    values: [namespaceName.name]
                }
            ]
        }
    }))

    const { resources: events, loading } = useWatchResources(ResourceType.EVENT, optsRef.current)

    const sort = () => {
        const items = dataSource(events)
        if (!items) {
            return undefined
        }
        return items.sort((a: any, b: any) => {
            return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
        })
    }

    return (
        <>
            <Table
                size="middle"
                loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
                columns={getColumns(setOpen, setCurrentEventDetail)}
                dataSource={sort()}
                rowKey={(e) => namespaceNameKey(e)}
                pagination={false}
            />

            <Drawer
                title="事件详情"
                open={open}
                onClose={() => setOpen(false)}
                closeIcon={false}
                width={650}
                footer={
                    <Flex justify="space-between" align="flex-start">
                        <Button onClick={() => setOpen(false)}>关闭</Button>
                    </Flex>
                }
            >
                <CodeMirror
                    className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                    value={yaml.dump(currentEventDetail).trimStart()}
                    maxHeight="100vh"
                    editable={false}
                    extensions={[langYaml()]}
                />
            </Drawer>
        </>
    )
}

const getColumns = (setOpen: any, setCurrentEventDetail: any) => {
    const columns: TableProps<any>['columns'] = [
        {
            title: 'type',
            key: 'type',
            ellipsis: true,
            width: 100,
            render: (_, e) => e.type
        },
        {
            title: 'source',
            key: 'source',
            ellipsis: true,
            width: 150,
            render: (_, e) => e.source.component
        },
        {
            title: 'reason',
            key: 'reason',
            ellipsis: true,
            width: 150,
            render: (_, e) => e.reason
        },
        {
            title: 'message',
            key: 'message',
            ellipsis: true,
            render: (_, e) => e.message
        },
        {
            title: 'lastTimestamp',
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
                setCurrentEventDetail(e)
                setOpen(true)
            }}>查看</Button>
        }
    ]
    return columns
}
