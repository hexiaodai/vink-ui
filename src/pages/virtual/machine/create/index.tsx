import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, Button, Divider, Flex, InputNumber, Space, Table, TableProps } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultNamespace, formatMemory, namespaceName } from '@/utils/k8s'
import { RootDisk } from './root-disk'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { createVirtualMachine, updateNamespaces } from './resource-manager'
import { jsonParse } from '@/utils/utils'
import { DataDisk } from './data-disk'
import { virtualmachineYaml, defaultCloudInit } from './constant'
import { useNavigate } from 'react-router-dom'
import { instances as labels } from '@/apis/sdks/ts/label/labels.gen'
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import TableColumnOperatingSystem from '@/components/table-column/operating-system'
import Styles from '@/pages/virtual/machine/create/styles/index.module.less'

const capacity = (rootDisk: CustomResourceDefinition) => {
    const spec = jsonParse(rootDisk.spec)
    const [value, uint] = formatMemory(spec.pvc?.resources?.requests?.storage)
    return `${value} ${uint}`
}

export default () => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    const [openRootDisk, setOpenRootDisk] = useState(false)
    const [openDataDisk, setOpenDataDisk] = useState(false)
    const [rootDisk, setRootDisk] = useState<CustomResourceDefinition>()
    const [dataDisks, setDataDisks] = useState<CustomResourceDefinition[]>([])

    const [namespaces, setNamespaces] = useState<CustomResourceDefinition[]>([])
    const updateNamespacesCallback = useCallback(updateNamespaces, [])

    useEffect(() => {
        updateNamespacesCallback(setNamespaces, notification)
    }, [])

    useEffect(() => {
        formRef.current?.setFieldsValue({
            rootDisk: rootDisk
        })
    }, [rootDisk])

    useEffect(() => {
        formRef.current?.setFieldsValue({
            dataDisks: dataDisks
        })
    }, [dataDisks])


    const dataDiskcolumns: TableProps<CustomResourceDefinition>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => `${dv.metadata?.name}`
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => capacity(dv)
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (<a onClick={() => {
                const newDisks = dataDisks.filter(item => !(namespaceName(item.metadata) === namespaceName(dv.metadata)))
                setDataDisks(newDisks)
            }}>删除</a>)
        }
    ]

    const submit = async () => {
        formRef.current?.
            validateFields({ validateOnly: false }).
            then(async () => {
                const fields = formRef.current?.getFieldsValue()
                console.log(fields)

                const instance: any = yaml.load(virtualmachineYaml)
                instance.metadata.name = fields.name
                instance.metadata.namespace = fields.namespace

                instance.spec.dataVolumeTemplates[0].metadata.name = `${fields.name}-root`
                instance.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkDatavolumeType.name] = "root"
                instance.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineOs.name] = fields.rootDisk.metadata.labels[labels.VinkVirtualmachineOs.name]
                instance.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineVersion.name] = fields.rootDisk.metadata.labels[labels.VinkVirtualmachineVersion.name]
                instance.spec.dataVolumeTemplates[0].spec.pvc.resources.requests.storage = `${fields.rootDiskCapacity}Gi`
                instance.spec.dataVolumeTemplates[0].spec.source.pvc.name = fields.rootDisk.metadata.name
                instance.spec.dataVolumeTemplates[0].spec.source.pvc.namespace = fields.rootDisk.metadata.namespace

                instance.spec.template.spec.domain.cpu.cores = fields.cpu
                instance.spec.template.spec.domain.resources.requests.memory = `${fields.memory}Gi`

                const additionalRootDisk = { dataVolume: { name: `${fields.name}-root` }, name: `${fields.name}-root` }
                const additionalDataDisks = fields.dataDisks?.map((disk: any) => ({
                    dataVolume: { name: disk.metadata.name },
                    name: disk.metadata.name
                })) || []
                const additionalCloudInit = { cloudInitNoCloud: { userDataBase64: btoa(fields.cloudInit) }, name: "cloudinit" }
                instance.spec.template.spec.volumes = [
                    additionalRootDisk,
                    ...additionalDataDisks,
                    additionalCloudInit
                ]

                instance.spec.template.spec.domain.devices.disks = instance.spec.template.spec.volumes.map((vol: any, idx: number) => ({
                    name: vol.name,
                    disk: { bus: "virtio" },
                    bootOrder: idx + 1
                }))

                await createVirtualMachine(instance, notification).then(() => {
                    navigate('/virtual/machines')
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

    return (
        <ProForm
            className={Styles["form"]}
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
                onSubmit: submit,
                render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
            }}
        >
            <Space
                direction="vertical"
                size="middle"
                className={Styles["container"]}
            >
                <ProCard title="基本信息" headerBordered>
                    <ProFormSelect
                        width="lg"
                        label="命名空间"
                        name="namespace"
                        placeholder="选择命名空间"
                        initialValue={defaultNamespace}
                        fieldProps={{ allowClear: false, showSearch: true }}
                        options={namespaces.map((ns: CustomResourceDefinition) => ({ value: ns.metadata?.name, label: ns.metadata?.name }))}
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
                        <Space size="large">
                            {
                                rootDisk?.metadata?.name ? (
                                    <Flex align='center'>
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
                    <ProFormItem
                        label="系统盘"
                        name="rootDiskCapacity"
                        initialValue={100}
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
                            style={{ width: 250 }}
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
                                    style={{ width: 492, marginBottom: 24 }}
                                    columns={dataDiskcolumns} dataSource={dataDisks} pagination={false}
                                    rowKey={(dv) => namespaceName(dv.metadata)}
                                />
                            )
                        }
                        <Button type="dashed" onClick={() => setOpenDataDisk(true)}>添加数据盘</Button>
                    </ProFormItem>
                </ProCard>

                <ProCard title="网络" headerBordered></ProCard>

                <ProCard title="系统设置" headerBordered>
                    <ProFormTextArea
                        width={600}
                        fieldProps={{ rows: 9 }}
                        placeholder="输入 cloud-init 脚本"
                        initialValue={defaultCloudInit.trim()}
                        name="cloudInit"
                        label="cloud-init"
                    />
                </ProCard>
            </Space>

            <RootDisk
                open={openRootDisk}
                onCanel={() => setOpenRootDisk(false)}
                current={rootDisk}
                onConfirm={(data) => {
                    setRootDisk(data)
                    setOpenRootDisk(false)
                }}
            />

            <DataDisk
                open={openDataDisk}
                onCanel={() => setOpenDataDisk(false)}
                current={dataDisks}
                onConfirm={(data) => {
                    setDataDisks(data)
                    setOpenDataDisk(false)
                }}
            />
        </ProForm >
    )
}
