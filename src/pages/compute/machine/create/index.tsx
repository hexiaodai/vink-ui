import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Divider, Flex, InputNumber, Space, Table } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemory, namespaceName } from '@/utils/k8s'
import { RootDiskDrawer } from './root-disk-drawer'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { capacity, classNames, jsonParse } from '@/utils/utils'
import { DataDiskDrawer } from './data-disk-drawer'
import { NetworkConfig, NetworkDrawer } from './network-drawer'
import { virtualmachineYaml, defaultCloudInit } from './crd-template'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import { instances as annotations } from '@/apis/sdks/ts/annotation/annotations.gen'
import { useNamespace } from '@/common/context'
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { getDataDiskColumns, getNetworkColumns } from './table-columns'
import { NotificationInstance } from 'antd/es/notification/interface'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { clients } from '@/clients/clients'
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import TableColumnOperatingSystem from '@/components/table-column/operating-system'
import styles from '@/pages/compute/machine/create/styles/index.module.less'
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import formStyles from "@/common/styles/form.module.less"
import commonStyles from "@/common/styles/common.module.less"

const submit = async (formRef: React.MutableRefObject<ProFormInstance | undefined>, notification: NotificationInstance, navigate: NavigateFunction) => {
    formRef.current?.
        validateFields({ validateOnly: false }).
        then(async () => {
            const fields = formRef.current?.getFieldsValue()

            const instance: any = yaml.load(virtualmachineYaml)

            instance.metadata.name = fields.name
            instance.metadata.namespace = fields.namespace

            setupCpuMem(formRef, instance)
            setupNetwork(formRef, instance)
            setupRootDisk(formRef, instance)
            setupDataDisks(formRef, instance)

            await clients.createResource(GroupVersionResourceEnum.VIRTUAL_MACHINE, instance, { notification: notification }).then(() => {
                navigate('/compute/machines')
            })
        }).
        catch((err: any) => {
            const errorMessage = err.errorFields?.map((field: any, idx: number) => `${idx + 1}. ${field.errors}`).join('<br />') || "表单校验失败"
            notification.error({
                message: "表单错误",
                description: (
                    <div dangerouslySetInnerHTML={{ __html: errorMessage }} />
                )
            })
        })
}

const setupCpuMem = (formRef: React.MutableRefObject<ProFormInstance | undefined>, vm: any) => {
    if (!formRef.current) {
        return
    }

    const fields = formRef.current.getFieldsValue()

    vm.spec.template.spec.domain.cpu.cores = fields.cpu
    vm.spec.template.spec.domain.resources.requests.memory = `${fields.memory}Gi`
}

const setupDataDisks = (formRef: React.MutableRefObject<ProFormInstance | undefined>, vm: any) => {
    if (!formRef.current) {
        return
    }

    const fields = formRef.current.getFieldsValue()
    if (!fields.dataDisks) {
        return
    }

    const rootDiskName = generateRootDiskName(fields.name)

    const additionalDataDisks = fields.dataDisks?.map((disk: any) => ({
        dataVolume: { name: disk.metadata.name },
        name: disk.metadata.name
    })) || []
    const additionalCloudInit = { cloudInitNoCloud: { userDataBase64: btoa(fields.cloudInit) }, name: "cloudinit" }
    vm.spec.template.spec.volumes = [...vm.spec.template.spec.volumes, ...additionalDataDisks, additionalCloudInit]

    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.volumes.map((vol: any) => {
        const result: any = {
            name: vol.name,
            disk: { bus: "virtio" }
        }
        if (vol.name == rootDiskName) {
            result.bootOrder = 1
        }
        return result
    })
}

const setupRootDisk = (formRef: React.MutableRefObject<ProFormInstance | undefined>, vm: any) => {
    if (!formRef.current) {
        return
    }

    const fields = formRef.current.getFieldsValue()
    if (!fields.rootDisk) {
        return
    }

    const rootDiskName = generateRootDiskName(fields.name)

    vm.spec.dataVolumeTemplates[0].metadata.name = rootDiskName
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkDatavolumeType.name] = "root"
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineOs.name] = fields.rootDisk.metadata.labels[labels.VinkVirtualmachineOs.name]
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineVersion.name] = fields.rootDisk.metadata.labels[labels.VinkVirtualmachineVersion.name]
    vm.spec.dataVolumeTemplates[0].metadata.annotations[annotations.VinkVirtualmachineBinding.name] = fields.name
    vm.spec.dataVolumeTemplates[0].spec.pvc.resources.requests.storage = `${fields.rootDiskCapacity}Gi`
    vm.spec.dataVolumeTemplates[0].spec.source.pvc.name = fields.rootDisk.metadata.name
    vm.spec.dataVolumeTemplates[0].spec.source.pvc.namespace = fields.rootDisk.metadata.namespace

    const additionalRootDisk = { dataVolume: { name: rootDiskName }, name: rootDiskName }
    vm.spec.template.spec.volumes = [...vm.spec.template.spec.volumes, additionalRootDisk]
    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.volumes.map((vol: any) => {
        const result: any = {
            name: vol.name,
            disk: { bus: "virtio" }
        }
        if (vol.name == rootDiskName) {
            result.bootOrder = 1
        }
        return result
    })
}

const setupNetwork = (formRef: React.MutableRefObject<ProFormInstance | undefined>, vm: any) => {
    if (!formRef.current) {
        return
    }

    const fields = formRef.current.getFieldsValue()
    if (!fields.networks) {
        return
    }

    vm.spec.template.spec.domain.devices.interfaces = fields.networks.map((network: NetworkConfig, idx: number) => {
        return { [network.networkMode]: {}, name: `net-${idx}` }
    })

    vm.spec.template.spec.networks = fields.networks.map((network: NetworkConfig, idx: number) => {
        const config: any = { name: `net-${idx}` }
        const networkName = `${network.multusCR.metadata?.namespace}/${network.multusCR.metadata?.name}`
        if (network.networkMode == "masquerade") {
            config.pod = {}
            vm.spec.template.metadata.annotations["v1.multus-cni.io/default-network"] = networkName
        } else {
            config.multus = { default: idx == 0, networkName: networkName }
        }

        if (network.ippool) {
            vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(network.multusCR, "ip_pool")] = network.ippool.metadata?.name
        }
        if (network.ipAddress && network.ipAddress.length > 0) {
            vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(network.multusCR, "ip_address")] = network.ipAddress
        }
        if (network.macAddress && network.macAddress.length > 0) {
            vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(network.multusCR, "mac_address")] = network.macAddress
        }

        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(network.multusCR, "logical_switch")] = network.subnet.metadata?.name
        return config
    })
}

const generateKubeovnNetworkAnnon = (multusCR: CustomResourceDefinition, name: string) => {
    const md = multusCR.metadata
    const prefix = `${md?.name}.${md?.namespace}.ovn.kubernetes.io`
    return `${prefix}/${name}`
}

const generateRootDiskName = (name: string) => {
    return `${name}-root`
}

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    const [openRootDisk, setOpenRootDisk] = useState(false)
    const [openDataDisk, setOpenDataDisk] = useState(false)
    const [openNetwork, setOpenNetwork] = useState(false)
    const [rootDisk, setRootDisk] = useState<CustomResourceDefinition>()
    const [dataDisks, setDataDisks] = useState<CustomResourceDefinition[]>([])
    const [networks, setNetworks] = useState<NetworkConfig[]>([])
    const [cloudInit, setCloudInit] = useState<string>(defaultCloudInit)

    useEffect(() => {
        formRef.current?.setFieldValue("rootDisk", rootDisk)
    }, [rootDisk])

    useEffect(() => {
        formRef.current?.setFieldValue("dataDisks", dataDisks)
    }, [dataDisks])

    useEffect(() => {
        formRef.current?.setFieldValue("namespace", namespace)
    }, [namespace])

    useEffect(() => {
        formRef.current?.setFieldValue("cloudInit", cloudInit)
    }, [cloudInit])

    const dataDiskcolumns = getDataDiskColumns(dataDisks, setDataDisks)
    const networkColumns = getNetworkColumns(networks, setNetworks)

    return (
        <>
            <ProForm
                className={classNames(formStyles["create-resource-form"], formStyles["required-label-right-indicator-form"])}
                labelCol={{ span: 4 }}
                layout="horizontal"
                labelAlign="left"
                colon={false}
                formRef={formRef}
                onReset={() => {
                    setRootDisk(undefined)
                    setDataDisks([])
                }}
                submitter={{
                    onSubmit: () => { submit(formRef, notification, navigate) },
                    render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
                }}
            >
                <Space
                    direction="vertical"
                    size="middle"
                >
                    <ProCard title="基本信息" headerBordered>
                        <ProFormText
                            width="lg"
                            name="namespace"
                            label="命名空间"
                            placeholder="请选择命名空间"
                            initialValue={namespace}
                            disabled
                            rules={[{
                                required: true,
                                pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                                message: "名称只能包含小写字母、数字和连字符（-），且必须以字母开头和结尾，最大长度为 64 个字符。"
                            }]}
                        />
                        <ProFormText
                            width="lg"
                            name="name"
                            label="名称"
                            placeholder="输入虚拟机名称"
                            rules={[{
                                required: true,
                                pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                                message: "名称只能包含小写字母、数字和连字符（-），且必须以字母开头和结尾，最大长度为 64 个字符。"
                            }]}
                        />
                        <ProFormItem
                            name="rootDisk"
                            label="系统镜像"
                            className={styles["root-disk"]}
                            rules={[{
                                required: true,
                                validator() {
                                    const rootDisk = formRef.current?.getFieldValue("rootDisk")
                                    const status = jsonParse(rootDisk?.status)
                                    if (status.phase === "Succeeded") {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject()
                                },
                                message: "系统镜像未就绪。"
                            }]}
                        >
                            <Space size="large" direction='vertical'>
                                {
                                    rootDisk?.metadata?.name ? (
                                        <Flex align='center' style={{ height: 32 }}>
                                            <TableColumnOperatingSystem rootDataVolume={rootDisk} />
                                            <Divider type="vertical" />
                                            <span>{rootDisk?.metadata?.name}</span>
                                            <Divider type="vertical" />
                                            <span>{capacity(rootDisk)}</span>
                                        </Flex>
                                    ) : ("")
                                }
                                <Button type="dashed" onClick={() => setOpenRootDisk(true)}>选择系统镜像</Button>
                            </Space>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="计算资源" headerBordered>
                        <ProFormSelect
                            width="lg"
                            label="处理器"
                            name="cpu"
                            placeholder="选择处理器核心数"
                            initialValue={2}
                            options={
                                Array.from({ length: 32 }, (_, i) => ({
                                    label: `${i + 1} 核`,
                                    value: i + 1
                                }))
                            }
                            fieldProps={{ allowClear: false, showSearch: true }}
                            rules={[{
                                required: true,
                                pattern: /^[1-9]\d*$/,
                                message: "请选择处理器核心数。"
                            }]}
                        />
                        <ProFormSelect
                            width="lg"
                            label="内存"
                            name="memory"
                            placeholder="选择内存大小"
                            initialValue={4}
                            options={
                                Array.from({ length: 32 }, (_, i) => ({
                                    label: `${i + 1} Gi`,
                                    value: i + 1
                                }))
                            }
                            fieldProps={{ allowClear: false, showSearch: true }}
                            rules={[{
                                required: true,
                                pattern: /^[1-9]\d*$/,
                                message: "请选择内存大小。"
                            }]}
                        />
                    </ProCard>

                    <ProCard title="存储" headerBordered>
                        {/* <ProFormSelect
                            width="lg"
                            label="存储类"
                            name="storageClass"
                            placeholder="选择存储类"
                            rules={[{
                                required: true,
                                message: "选择存储类。"
                            }]}
                        />
                        <ProFormSelect
                            width="lg"
                            label="访问模式"
                            name="accessMode"
                            placeholder="选择访问模式"
                            rules={[{
                                required: true,
                                message: "选择访问模式。"
                            }]}
                        /> */}
                        <ProFormItem
                            label="系统盘"
                            name="rootDiskCapacity"
                            initialValue={50}
                            rules={[{
                                required: true,
                                validator() {
                                    const rootDiskCapacity = formRef.current?.getFieldValue("rootDiskCapacity")
                                    const rootDisk = formRef.current?.getFieldValue("rootDisk")
                                    if (!rootDisk) {
                                        return Promise.resolve()
                                    }
                                    const spec = jsonParse(rootDisk?.spec)
                                    const [value] = formatMemory(spec.pvc?.resources?.requests?.storage)
                                    if (rootDiskCapacity <= parseInt(value)) {
                                        return Promise.reject()
                                    }
                                    return Promise.resolve()
                                },
                                message: "系统盘的磁盘空间容量需大于所选系统镜像的容量。"
                            }]}
                        >
                            <InputNumber<number>
                                min={10}
                                max={2048}
                                step={5}
                                style={{ width: 440 }}
                                formatter={(value) => `${value} Gi`}
                                parser={(value) => value?.replace(' Gi', '') as unknown as number}
                            />
                        </ProFormItem>

                        <ProFormItem
                            name="dataDisks"
                            label="数据盘"
                        >
                            {
                                dataDisks.length > 0 && (
                                    <Table
                                        size="small"
                                        style={{ marginBottom: 24 }}
                                        columns={dataDiskcolumns} dataSource={dataDisks} pagination={false}
                                        rowKey={(dv) => namespaceName(dv.metadata)}
                                    />
                                )
                            }
                            <Button type="dashed" onClick={() => setOpenDataDisk(true)}>添加数据盘</Button>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="网络" headerBordered>
                        <ProFormItem
                            name="networks"
                            label="网络接口"
                            rules={[{
                                required: true,
                                validator() {
                                    if (networks.length == 0) {
                                        return Promise.reject()
                                    }
                                    return Promise.resolve()
                                },
                                message: "请添加网络接口。"
                            }]}
                        >
                            {
                                networks.length > 0 && (
                                    <Table
                                        size="small"
                                        className={commonStyles["small-scrollbar"]}
                                        scroll={{ x: 1000 }}
                                        style={{ marginBottom: 24 }}
                                        columns={networkColumns} dataSource={networks} pagination={false}
                                        rowKey={(cfg) => cfg.multusCR.metadata?.name!}
                                    />
                                )
                            }
                            <Button type="dashed" onClick={() => setOpenNetwork(true)}>添加网络</Button>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="高级设置" headerBordered>
                        <ProFormItem name="cloudInit" label="Cloud-Init">
                            <CodeMirror
                                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                                value={defaultCloudInit.trimStart()}
                                maxHeight="100vh"
                                extensions={[langYaml()]}
                                onChange={(value) => {
                                    setCloudInit(value)
                                }}
                            />
                        </ProFormItem>
                    </ProCard>
                </Space>
            </ProForm >

            <RootDiskDrawer
                open={openRootDisk}
                onCanel={() => setOpenRootDisk(false)}
                current={rootDisk}
                onConfirm={(data) => {
                    setRootDisk(data)
                    setOpenRootDisk(false)
                    formRef.current?.setFieldValue("rootDisk", data)
                }}
            />

            <DataDiskDrawer
                open={openDataDisk}
                onCanel={() => setOpenDataDisk(false)}
                current={dataDisks}
                onConfirm={(data) => {
                    setDataDisks(data)
                    setOpenDataDisk(false)
                    formRef.current?.setFieldValue("dataDisks", data)
                }}
            />

            <NetworkDrawer
                open={openNetwork}
                namespace={namespace}
                onCanel={() => setOpenNetwork(false)}
                onConfirm={(data) => {
                    const hasElement = networks.some(cfg => {
                        return cfg.multusCR.metadata?.name === data.multusCR.metadata?.name
                    })
                    if (hasElement) {
                        return
                    }
                    const newNetworks = networks.concat(data)
                    setNetworks(newNetworks)
                    setOpenNetwork(false)
                    formRef.current?.setFieldValue("networks", newNetworks)
                }}
            />
        </>
    )
}
