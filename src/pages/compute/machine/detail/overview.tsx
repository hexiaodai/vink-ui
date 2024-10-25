import { App, Space, Spin } from "antd"
import { useEffect, useRef, useState } from "react"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { namespaceNameKey } from "@/utils/k8s"
import { ProCard, ProDescriptions } from "@ant-design/pro-components"
import { useWatchResources } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import { classNames, updateNestedValue } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"

export default () => {
    const { notification } = App.useApp()

    const actionRef = useRef()

    const [virtualMachine, setVirtualMachine] = useState<any>()

    const namespaceName = useNamespaceFromURL()

    const { resources: virtualMachineMap, loading } = useWatchResources(GroupVersionResourceEnum.VIRTUAL_MACHINE)

    useEffect(() => {
        setVirtualMachine(virtualMachineMap.get(namespaceNameKey(namespaceName)))
    }, [virtualMachineMap])

    const handleSave = async (keypath: any, newInfo: any, oriInfo: any) => {
        const deepCopyOriInfo = JSON.parse(JSON.stringify(oriInfo))
        updateNestedValue(keypath as string[], newInfo, deepCopyOriInfo, true)
        await clients.updateResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, deepCopyOriInfo, { notification: notification }).then(() => {
            return true
        }).catch(() => {
            return false
        })
    }

    const cloudinit = () => {
        const vol = virtualMachine?.spec.template.spec.volumes.find((vol: any) => {
            return vol.cloudInitNoCloud
        })
        return vol?.cloudInitNoCloud?.userDataBase64 ? atob(vol.cloudInitNoCloud.userDataBase64) : undefined
    }

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} >
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
                            onSave: handleSave
                        }}
                    >
                        <ProDescriptions.Item
                            title="Name"
                            key="name"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine?.metadata.name}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Namespace"
                            key="namespace"
                            ellipsis
                            editable={false}
                        >
                            {virtualMachine?.metadata.namespace}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'architecture']}
                            title="Architecture"
                            key="architecture"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'runStrategy']}
                            title="RunStrategy"
                            key="runStrategy"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['metadata', 'creationTimestamp']}
                            title="CreationTimestamp"
                            key="creationTimestamp"
                            ellipsis
                            editable={false}
                        />
                    </ProDescriptions>
                </ProCard>

                <ProCard title="CPU">
                    <ProDescriptions
                        actionRef={actionRef}
                        dataSource={virtualMachine}
                        column={3}
                        editable={{
                            onSave: handleSave
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
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'maxSockets']}
                            title="MaxSockets"
                            key="maxSockets"
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
                            onSave: handleSave
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
                            onSave: handleSave
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
        </Spin>
    )
}
