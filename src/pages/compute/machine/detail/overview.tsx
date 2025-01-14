import { App, Space, Spin } from "antd"
import { useEffect, useRef, useState } from "react"
import { ProCard, ProDescriptions } from "@ant-design/pro-components"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames, formatTimestamp, updateNestedValue } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { DataVolume, getRootDisk } from "@/clients/data-volume"
import { updateVirtualMachine, VirtualMachine, watchVirtualMachine } from "@/clients/virtual-machine"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import OperatingSystem from "@/components/operating-system"
import VirtualMachineStatus from "@/pages/compute/machine/components/status"
import Terminal from "@/components/terminal"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const actionRef = useRef()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [virtualMachine, setVirtualMachine] = useState<VirtualMachine>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachine(ns, setVirtualMachine, setLoading, abortCtrl.current.signal)
    }, [ns])

    const [rootDiskLoading, setRootDiskLoading] = useState(true)
    const [rootDisk, setRootDisk] = useState<DataVolume>()

    useEffect(() => {
        if (!virtualMachine) {
            return
        }
        getRootDisk(virtualMachine, setRootDisk, setRootDiskLoading)
    }, [virtualMachine])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const cloudinit = () => {
        const vol = virtualMachine?.spec?.template?.spec?.volumes?.find((vol: any) => {
            return vol.cloudInitNoCloud
        })
        const userData = vol?.cloudInitNoCloud?.userDataBase64
        if (!userData) {
            return
        }
        return atob(userData)
    }

    const handleSave = async (keypath: any, newInfo: any, oriInfo: any) => {
        const deepCopyOriInfo = JSON.parse(JSON.stringify(oriInfo))
        updateNestedValue(keypath as string[], newInfo, deepCopyOriInfo, true)
        await updateVirtualMachine(deepCopyOriInfo, undefined, undefined, notification)
    }

    return (
        <Spin spinning={loading || rootDiskLoading} delay={500} indicator={<LoadingOutlined spin />} >
            <Space
                direction="vertical"
                size="middle"
            >
                <ProCard title="Basic information">
                    <ProDescriptions
                        actionRef={actionRef}
                        column={3}
                        dataSource={virtualMachine}
                        editable={{
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo)
                        }}
                    >
                        <ProDescriptions.Item
                            title="Status"
                            key="status"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine && <VirtualMachineStatus vm={virtualMachine} />}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Operating System"
                            key="os"
                            ellipsis
                            editable={false}
                        >
                            <OperatingSystem dv={rootDisk} />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Terminal"
                            key="terminal"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine && <Terminal vm={virtualMachine} />}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Name"
                            key="name"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine?.metadata?.name}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Namespace"
                            key="namespace"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine?.metadata?.namespace}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'architecture']}
                            title="Architecture"
                            key="architecture"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'runStrategy']}
                            title="Run Strategy"
                            key="runStrategy"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['metadata', 'creationTimestamp']}
                            title="Creation Timestamp"
                            key="creationTimestamp"
                            ellipsis
                            editable={false}
                            render={(_, vm: any) => {
                                const timestamp = vm?.metadata?.creationTimestamp
                                if (!timestamp) {
                                    return
                                }
                                return formatTimestamp(timestamp)
                            }}
                        />
                    </ProDescriptions>
                </ProCard>

                <ProCard title="CPU">
                    <ProDescriptions
                        actionRef={actionRef}
                        dataSource={virtualMachine}
                        column={3}
                        editable={{
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo)
                        }}
                    >
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'cores']}
                            title="Cores"
                            key="cores"
                            valueType="digit"
                            ellipsis
                            render={(value: any) => value}
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'model']}
                            title="Model"
                            key="model"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'threads']}
                            title="Threads"
                            key="threads"
                            valueType="digit"
                            ellipsis
                            render={(value: any) => value}
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'sockets']}
                            title="Sockets"
                            key="sockets"
                            valueType="digit"
                            ellipsis
                            render={(value: any) => value}
                        />
                    </ProDescriptions>
                </ProCard>

                <ProCard title="Memory">
                    <ProDescriptions
                        actionRef={actionRef}
                        dataSource={virtualMachine}
                        column={3}
                        editable={{
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo)
                        }}
                    >
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'memory', 'guest']}
                            title="Guest"
                            key="guest"
                            ellipsis
                        />
                    </ProDescriptions>
                </ProCard>

                <ProCard title="Resource limit">
                    <ProDescriptions
                        actionRef={actionRef}
                        dataSource={virtualMachine}
                        column={3}
                        editable={{
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo)
                        }}
                    >
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'requests', 'memory']}
                            title="Requests Memory"
                            key="requests.memory"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'requests', 'cpu']}
                            title="Requests CPU"
                            key="requests.cpu"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'limits', 'memory']}
                            title="Limits Memory"
                            key="limits.memory"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'limits', 'cpu']}
                            title="Limits CPU"
                            key="limits.cpu"
                            ellipsis
                        />
                    </ProDescriptions>
                </ProCard>
                <ProCard title="Cloudinit">
                    <CodeMirror
                        className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                        value={cloudinit()?.trimStart()}
                        maxHeight="100vh"
                        editable={false}
                        extensions={[langYaml()]}
                    />
                </ProCard>
            </Space>
        </Spin >
    )
}
