import { App, Space, Spin } from "antd"
import { useEffect, useRef, useState } from "react"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { ProCard, ProDescriptions } from "@ant-design/pro-components"
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames, formatTimestamp, updateNestedValue } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { NotificationInstance } from "antd/es/notification/interface"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import OperatingSystem from "@/components/operating-system"
import VirtualMachineStatus from "@/pages/compute/machine/components/status"
import Terminal from "@/components/terminal"

const handleSave = async (keypath: any, newInfo: any, oriInfo: any, notification: NotificationInstance) => {
    const deepCopyOriInfo = JSON.parse(JSON.stringify(oriInfo))
    updateNestedValue(keypath as string[], newInfo, deepCopyOriInfo, true)
    await clients.updateResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, deepCopyOriInfo, { notification: notification }).then(() => {
        return true
    }).catch(() => {
        return false
    })
}

const cloudinit = (virtualMachine: any) => {
    const vol = virtualMachine.spec.template.spec.volumes.find((vol: any) => {
        return vol.cloudInitNoCloud
    })
    return vol?.cloudInitNoCloud?.userDataBase64 ? atob(vol.cloudInitNoCloud.userDataBase64) : undefined
}

export default () => {
    const { notification } = App.useApp()

    const actionRef = useRef()

    const { resource: virtualMachine, loading } = useWatchResourceInNamespaceName(GroupVersionResourceEnum.VIRTUAL_MACHINE)

    const [rootDisk, setRootDisk] = useState<any>()

    useEffect(() => {
        if (!virtualMachine || virtualMachine.spec.template.spec.domain.devices.disks.length == 0) {
            return
        }

        let disk = virtualMachine.spec.template.spec.domain.devices.disks.find((disk: any) => {
            return disk.bootOrder == 1
        })
        if (!disk) {
            disk = virtualMachine.spec.template.spec.domain.devices.disks[0]
        }

        const vol = virtualMachine.spec.template.spec.volumes.find((vol: any) => {
            return vol.name == disk.name
        })

        clients.fetchResource(GroupVersionResourceEnum.DATA_VOLUME, { namespace: virtualMachine.metadata.namespace, name: vol.dataVolume.name }).then((crd: any) => {
            setRootDisk(crd)
            console.log(crd)
        }).catch((err: any) => {
            notification.error({
                message: "获取系统盘失败",
                description: err.message
            })
        })
    }, [virtualMachine])

    if (!virtualMachine) {
        return
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
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo, notification)
                        }}
                    >
                        <ProDescriptions.Item
                            title="Status"
                            key="status"
                            ellipsis
                            editable={false}
                        >
                            <VirtualMachineStatus vm={virtualMachine} />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Operating System"
                            key="os"
                            ellipsis
                            editable={false}
                        >
                            <OperatingSystem rootDataVolume={rootDisk} />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="Terminal"
                            key="terminal"
                            ellipsis
                            editable={false}
                        >
                            <Terminal vm={virtualMachine} />
                        </ProDescriptions.Item>
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
                            render={(_, vm: any) => formatTimestamp(vm.metadata?.creationTimestamp)}
                        />
                    </ProDescriptions>
                </ProCard>

                <ProCard title="CPU">
                    <ProDescriptions
                        actionRef={actionRef}
                        dataSource={virtualMachine}
                        column={3}
                        editable={{
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo, notification)
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
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo, notification)
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
                            onSave: (keypath, newInfo, oriInfo) => handleSave(keypath, newInfo, oriInfo, notification)
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
                        value={cloudinit(virtualMachine)?.trimStart()}
                        maxHeight="100vh"
                        editable={false}
                        extensions={[langYaml()]}
                    />
                </ProCard>
            </Space>
        </Spin >
    )
}
