import { App, Popconfirm, Space, Spin } from "antd"
import { useRef, useState } from "react"
import { ProCard, ProDescriptions } from "@ant-design/pro-components"
import { LoadingOutlined } from '@ant-design/icons'
import { calculateResourceAge, updateNestedValue } from "@/utils/utils"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { manageVirtualMachinePowerState, VirtualMachine } from "@/clients/virtual-machine"
import { Grafana, GrafanaProps } from "@/components/grafana"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResource } from "@/hooks/use-watch-resource"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"
import OperatingSystem from "@/components/operating-system"
import VirtualMachineStatus from "@/pages/virtual/machine/components/virtual-machine-status"
import Terminal from "@/components/terminal"
import styles from "./styles/index.module.less"
import { update } from "@/clients/clients"

export default () => {
    const { notification } = App.useApp()

    const actionRef = useRef()

    const nn = useNamespaceFromURL()

    const { resource, loading } = useWatchResource<VirtualMachine>(ResourceType.VIRTUAL_MACHINE)

    const [popupVisible, setPopupVisible] = useState(false)

    const dash: GrafanaProps = {
        overviewUID: "vink-virtualmachine",
        panelID: "vink-virtualmachine",
        hideTimePicker: true,
        queryParams: { "var-namespace": nn.namespace, "var-vm": nn.name },
        clearPadding: true,
    }

    return (
        <Spin spinning={loading} delay={500} indicator={<LoadingOutlined spin />} >
            <Space direction="vertical" size="middle" className={styles["space-container"]}>
                <ProCard title="基本信息">
                    <ProDescriptions
                        actionRef={actionRef}
                        column={4}
                        dataSource={resource}
                        editable={{
                            onSave: async (keypath, newInfo, oriInfo) => {
                                const deepCopyOriInfo = JSON.parse(JSON.stringify(oriInfo))
                                updateNestedValue(keypath as string[], newInfo, deepCopyOriInfo, true)
                                await update(deepCopyOriInfo, undefined, undefined, notification)
                                if (resource?.status?.printableStatus === "Running") {
                                    setPopupVisible(true)
                                }
                            }
                        }}
                    >
                        <ProDescriptions.Item
                            title="名称"
                            key="name"
                            ellipsis
                            editable={false}
                        >
                            {resource?.metadata?.name}
                        </ProDescriptions.Item>
                        <Popconfirm
                            title="配置已更新，是否立即重启虚拟机？"
                            open={popupVisible}
                            onConfirm={async () => {
                                await manageVirtualMachinePowerState(nn, VirtualMachinePowerStateRequest_PowerState.REBOOT, undefined, notification)
                                setPopupVisible(false)
                            }}
                            onCancel={() => setPopupVisible(false)}
                            okText="立即重启"
                            cancelText="稍后再说"
                        >
                            <ProDescriptions.Item
                                title="状态"
                                key="status"
                                ellipsis
                                editable={false}
                            >
                                {resource && <VirtualMachineStatus vm={resource} />}
                            </ProDescriptions.Item>
                        </Popconfirm>
                        <ProDescriptions.Item
                            title="操作系统"
                            key="os"
                            ellipsis
                            editable={false}
                        >
                            <OperatingSystem vm={resource} />
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            title="控制台"
                            key="terminal"
                            ellipsis
                            editable={false}
                        >
                            {resource && <Terminal vm={resource} />}
                        </ProDescriptions.Item>
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'architecture']}
                            title="架构"
                            key="architecture"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'runStrategy']}
                            title="运行策略"
                            key="runStrategy"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'cores']}
                            title="Guest CPU"
                            key="cores"
                            valueType="digit"
                            ellipsis
                            render={(value: any) => value}
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'requests', 'cpu']}
                            title="请求 CPU"
                            key="requests.cpu"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'limits', 'cpu']}
                            title="CPU 限额"
                            key="limits.cpu"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'cpu', 'model']}
                            title="CPU 模式"
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
                            dataIndex={['spec', 'template', 'spec', 'domain', 'memory', 'guest']}
                            title="Guest 内存"
                            key="guest"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'requests', 'memory']}
                            title="请求内存"
                            key="requests.memory"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['spec', 'template', 'spec', 'domain', 'resources', 'limits', 'memory']}
                            title="内存限额"
                            key="limits.memory"
                            ellipsis
                        />
                        <ProDescriptions.Item
                            dataIndex={['metadata', 'creationTimestamp']}
                            title="Age"
                            key="age"
                            ellipsis
                            editable={false}
                            render={(_, vm: any) => calculateResourceAge(vm)}
                        />
                    </ProDescriptions>
                </ProCard>

                <Grafana {...dash} />
            </Space>
        </Spin >
    )
}
