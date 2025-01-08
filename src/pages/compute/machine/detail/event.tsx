import { ResourceType } from "@/clients/ts/types/types"
import { classNames, formatTimestamp, getErrorMessage } from "@/utils/utils"
import { App, Button, Drawer, Flex, Table, TableProps } from "antd"
import { LoadingOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from "react"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { namespaceNameKey } from "@/utils/k8s"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { watchVirtualMachineEvents } from "@/clients/event"
import { getResourceName } from "@/clients/clients"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const ns = useNamespaceFromURL()

    const [open, setOpen] = useState(false)

    const [currentEventDetail, setCurrentEventDetail] = useState<any>()

    const [loading, setLoading] = useState(true)

    const [events, setEvents] = useState<any[]>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachineEvents(ns, setEvents, setLoading, abortCtrl.current.signal).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.EVENT),
                description: getErrorMessage(err)
            })
        })
    }, [ns])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(ResourceType.EVENT))
        abortCtrl.current?.abort()
    })

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

    return (
        <>
            <Table
                size="middle"
                loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined spin /> }}
                columns={columns}
                dataSource={events}
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
