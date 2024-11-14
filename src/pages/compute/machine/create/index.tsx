import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Divider, Flex, InputNumber, Space, Table, TableProps } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { formatMemory, namespaceName, namespaceNameKey } from '@/utils/k8s'
import { capacity, classNames, getErrorMessage } from '@/utils/utils'
import { DataDiskDrawer } from '@/pages/compute/machine/components/data-disk-drawer'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { ResourceType } from '@/clients/ts/types/types'
import { clients, getResourceName } from '@/clients/clients'
import { PlusOutlined } from '@ant-design/icons'
import { NetworkConfig, newVirtualMachine } from '../virtualmachine'
import { NetworkDrawer } from '../components/network-drawer'
import { defaultCloudInit } from '../virtualmachine/template'
import { RootDiskDrawer } from '../components/root-disk-drawer'
import type { ProFormInstance } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import styles from '@/pages/compute/machine/create/styles/index.module.less'
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import formStyles from "@/common/styles/form.module.less"
import commonStyles from "@/common/styles/common.module.less"

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    const [openDrawer, setOpenDrawer] = useState({ rootDisk: false, network: false, dataDisk: false })

    useEffect(() => {
        formRef.current?.setFieldValue("namespace", namespace)
        if (namespace) {
            formRef.current?.validateFields(["namespace"])
        }
    }, [namespace])

    useEffect(() => {
        return formRef.current?.setFieldValue("cloudInit", defaultCloudInit)
    }, [defaultCloudInit])

    const dataDiskcolumns = getDataDiskColumns(formRef)
    const networkColumns = getNetworkColumns(formRef)

    const [inputCpuValue, setInputCpuValue] = useState<number>()
    const [inputMemValue, setInputMemValue] = useState<number>()

    const [_, setReset] = useState(false)

    const createOptions = (count: number, multiplier: number, unit: string) => {
        return Array.from({ length: count }, (_, i) => ({
            label: `${(i + 1) * multiplier} ${unit}`,
            value: (i + 1) * multiplier
        }))
    }

    const [cpuOptions, setCpuOptions] = useState(createOptions(32, 2, "Core"))
    const [memOptions, setMemOptions] = useState(createOptions(32, 2, "Gi"))

    const handleAddNewOption = (
        inputValue: number | undefined,
        options: { label: string; value: number }[],
        setOptions: React.Dispatch<React.SetStateAction<{ label: string, value: number }[]>>,
        fieldName: "cpu" | "memory"
    ) => {
        if (!inputValue || !formRef.current) {
            return
        }
        const unit = fieldName === "cpu" ? "Core" : "Gi"
        if (!options.some(opt => opt.value === inputValue)) {
            const newOption = { label: `${inputValue} ${unit}`, value: inputValue }
            setOptions([...options, newOption])
            formRef.current.setFieldsValue({ [fieldName]: inputValue })
        }
    }

    const handleSubmit = async () => {
        if (!formRef.current) {
            return
        }

        try {
            await formRef.current.validateFields()

            const fields = formRef.current.getFieldsValue()

            const namespaceName = { name: fields.name, namespace: fields.namespace }
            const cpuMem = { cpu: fields.cpu, memory: fields.memory }
            const rootDisk = { image: fields.rootDisk, capacity: fields.rootDiskCapacity }
            const instance = newVirtualMachine(
                namespaceName,
                cpuMem,
                rootDisk,
                fields.dataDisks || [],
                fields.networks,
                fields.cloudInit
            )
            await clients.createResource(ResourceType.VIRTUAL_MACHINE, instance)
            navigate('/compute/machines')
        } catch (err: any) {
            const errorMessage = err.errorFields?.map((field: any, idx: number) => `${idx + 1}. ${field.errors}`).join('<br />') || getErrorMessage(err)
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: (
                    <div dangerouslySetInnerHTML={{ __html: errorMessage }} />
                )
            })
        }
    }

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
                    formRef.current?.resetFields()
                    setReset((pre) => !pre)
                }}
                submitter={{
                    onSubmit: handleSubmit,
                    render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
                }}
            >
                <Space
                    direction="vertical"
                    size="middle"
                >
                    <ProCard title="基本信息">
                        <ProFormText
                            width="lg"
                            name="namespace"
                            label="命名空间"
                            placeholder="选择命名空间"
                            initialValue={namespace}
                            disabled
                            rules={[{
                                required: true,
                                pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                                message: "命名空间仅含小写字母、数字、连字符（-），且以字母开头和结尾，最长 64 字符"
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
                                message: "名称仅含小写字母、数字、连字符（-），且以字母开头和结尾，最长 64 字符"
                            }]}
                        />
                        <ProFormItem
                            name="rootDisk"
                            label="系统镜像"
                            className={styles["root-disk"]}
                            rules={[{
                                required: true,
                                validator() {
                                    return formRef.current?.getFieldValue("rootDisk") ? Promise.resolve() : Promise.reject()
                                },
                                message: "添加操作系统"
                            }]}
                        >
                            <Space size="large" direction='vertical'>
                                {
                                    formRef.current?.getFieldValue("rootDisk")?.metadata.name ? (
                                        <Flex align='center' style={{ height: 32 }}>
                                            <OperatingSystem dv={formRef.current?.getFieldValue("rootDisk")} />
                                            <Divider type="vertical" />
                                            <span>{formRef.current?.getFieldValue("rootDisk").metadata.name}</span>
                                            <Divider type="vertical" />
                                            <span>{capacity(formRef.current?.getFieldValue("rootDisk"))}</span>
                                        </Flex>
                                    ) : ("")
                                }
                                <Button
                                    color="default"
                                    icon={<PlusOutlined />}
                                    variant="text"
                                    onClick={() => setOpenDrawer((prevState) => ({ ...prevState, rootDisk: true }))}
                                >
                                    添加系统镜像
                                </Button>
                            </Space>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="计算资源">
                        <ProFormSelect
                            width="lg"
                            label="处理器"
                            name="cpu"
                            placeholder="选择处理器核心数"
                            initialValue={2}
                            options={cpuOptions}
                            fieldProps={{
                                allowClear: false,
                                showSearch: true,
                                dropdownRender: (menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 4px' }}>
                                            <InputNumber
                                                style={{ flex: 'auto' }}
                                                min={1}
                                                max={1024}
                                                value={inputCpuValue}
                                                onChange={(value) => setInputCpuValue(value || undefined)}
                                                placeholder="新增处理器核心数"
                                            />
                                            <Button
                                                color="default"
                                                icon={<PlusOutlined />}
                                                variant="text"
                                                style={{ marginLeft: 10 }}
                                                onClick={() => handleAddNewOption(inputCpuValue, cpuOptions, setCpuOptions, "cpu")}
                                            >
                                                新增
                                            </Button>
                                        </div>
                                    </>
                                )
                            }}
                            rules={[{
                                required: true,
                                pattern: /^[1-9]\d*$/,
                                message: "选择处理器核心数"
                            }]}
                        />
                        <ProFormSelect
                            width="lg"
                            label="内存"
                            name="memory"
                            placeholder="选择内存大小"
                            initialValue={4}
                            options={memOptions}
                            fieldProps={{
                                allowClear: false,
                                showSearch: true,
                                dropdownRender: (menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 4px' }}>
                                            <InputNumber
                                                style={{ flex: 'auto' }}
                                                min={1}
                                                max={1024}
                                                value={inputMemValue}
                                                onChange={(value) => setInputMemValue(value || undefined)}
                                                placeholder="新增内存大小"
                                            />
                                            <Button
                                                color="default"
                                                icon={<PlusOutlined />}
                                                variant="text"
                                                style={{ marginLeft: 10 }}
                                                onClick={() => handleAddNewOption(inputMemValue, memOptions, setMemOptions, "memory")}
                                            >
                                                新增
                                            </Button>
                                        </div>
                                    </>
                                )
                            }}
                            rules={[{
                                required: true,
                                pattern: /^[1-9]\d*$/,
                                message: "选择内存大小"
                            }]}
                        />
                    </ProCard>

                    <ProCard title="存储">
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
                                    const [value] = formatMemory(rootDisk.spec.pvc.resources.requests.storage)
                                    if (rootDiskCapacity <= parseInt(value)) {
                                        return Promise.reject()
                                    }
                                    return Promise.resolve()
                                },
                                message: "系统盘的磁盘空间容量需大于所选系统镜像的容量"
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
                                formRef.current?.getFieldValue("dataDisks") && (
                                    <Table
                                        size="small"
                                        style={{ marginBottom: 24 }}
                                        columns={dataDiskcolumns} dataSource={formRef.current?.getFieldValue("dataDisks")} pagination={false}
                                        rowKey={(dv) => namespaceName(dv.metadata)}
                                    />
                                )
                            }
                            <Button
                                color="default"
                                icon={<PlusOutlined />}
                                variant="text"
                                onClick={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: true }))}
                            >
                                添加数据盘
                            </Button>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="网络">
                        <ProFormItem
                            name="networks"
                            label="网络接口"
                            rules={[{
                                required: true,
                                validator() {
                                    const networks = formRef.current?.getFieldValue("networks")
                                    if (!networks || networks.length == 0) {
                                        return Promise.reject()
                                    }
                                    return Promise.resolve()
                                },
                                message: "添加网络接口"
                            }]}
                        >
                            {
                                formRef.current?.getFieldValue("networks") && (
                                    <Table
                                        size="small"
                                        className={commonStyles["small-scrollbar"]}
                                        scroll={{ x: 1300 }}
                                        style={{ marginBottom: 24 }}
                                        columns={networkColumns} dataSource={formRef.current?.getFieldValue("networks")} pagination={false}
                                        rowKey={(cfg) => namespaceNameKey(cfg.multus)}
                                    />
                                )
                            }
                            <Button
                                color="default"
                                icon={<PlusOutlined />}
                                variant="text"
                                onClick={() => setOpenDrawer((prevState) => ({ ...prevState, network: true }))}
                            >
                                添加网络
                            </Button>
                        </ProFormItem>
                    </ProCard>

                    <ProCard title="高级设置">
                        <ProFormItem name="cloudInit" label="Cloud-Init">
                            <CodeMirror
                                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                                value={defaultCloudInit.trimStart()}
                                maxHeight="100vh"
                                extensions={[langYaml()]}
                                onChange={(value) => {
                                    formRef.current?.setFieldValue("cloudInit", value)
                                }}
                            />
                        </ProFormItem>
                    </ProCard>
                </Space>
            </ProForm >

            <RootDiskDrawer
                open={openDrawer.rootDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, rootDisk: false }))}
                current={formRef.current?.getFieldValue("rootDisk")}
                onConfirm={(data) => {
                    setOpenDrawer((prevState) => ({ ...prevState, rootDisk: false }))
                    formRef.current?.setFieldValue("rootDisk", data)
                    formRef.current?.validateFields(["rootDisk"])
                }}
            />

            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}

                current={formRef.current?.getFieldValue("dataDisks")}
                onConfirm={(data) => {
                    setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
                    formRef.current?.setFieldValue("dataDisks", data)
                    formRef.current?.validateFields(["dataDisks"])
                }}
            />

            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={(data) => {
                    const networks = formRef.current?.getFieldValue("networks") || []
                    const hasElement = networks.some((cfg: any) => {
                        return namespaceNameKey(cfg.multus) === namespaceNameKey(data.multus)
                    })
                    if (hasElement) {
                        return
                    }
                    const newNetworks = networks.concat(data)
                    setOpenDrawer((prevState) => ({ ...prevState, network: false }))
                    formRef.current?.setFieldValue("networks", newNetworks)
                    formRef.current?.validateFields(["networks"])
                }}
            />
        </>
    )
}

const getDataDiskColumns = (formRef: React.MutableRefObject<ProFormInstance | undefined>) => {
    const dataDiskColumns: TableProps<any>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => dv.metadata.name
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.storageClassName
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc.accessModes[0]
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
                if (!formRef.current) {
                    return
                }
                const dataDisks = formRef.current.getFieldValue('dataDisks')
                const newDisks = dataDisks.filter((item: any) => !(namespaceNameKey(item.metadata) === namespaceNameKey(dv.metadata)))
                formRef.current.setFieldValue('dataDisks', newDisks)
            }}>移除</a>)
        }
    ]
    return dataDiskColumns
}

const getNetworkColumns = (formRef: React.MutableRefObject<ProFormInstance | undefined>) => {
    const networkColumns: TableProps<NetworkConfig>['columns'] = [
        {
            title: 'Network',
            key: 'network',
            ellipsis: true,
            render: (_, cfg) => cfg.network
        },
        {
            title: 'Interface',
            key: 'interface',
            ellipsis: true,
            render: (_, cfg) => cfg.interface
        },
        {
            title: '默认网络',
            key: 'default',
            ellipsis: true,
            render: (_, cfg) => cfg.default ? "是" : "否"
        },
        {
            title: 'Multus CR',
            key: 'multusCR',
            ellipsis: true,
            render: (_, cfg) => namespaceNameKey(cfg.multus)
        },
        {
            title: 'VPC',
            key: 'vpc',
            ellipsis: true,
            render: (_, cfg) => cfg.subnet?.spec.vpc
        },
        {
            title: '子网',
            key: 'subnet',
            ellipsis: true,
            render: (_, cfg) => cfg.subnet?.metadata.name
        },
        {
            title: 'IP 地址池',
            key: 'ippool',
            ellipsis: true,
            render: (_, cfg) => cfg.ippool?.metadata.name || "自动分配"
        },
        {
            title: 'IP 地址',
            key: 'ipAddress',
            ellipsis: true,
            render: (_, cfg) => cfg.ipAddress || "自动分配"
        },
        {
            title: 'MAC 地址',
            key: 'macAddress',
            ellipsis: true,
            render: (_, cfg) => cfg.macAddress || "自动分配"
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, cfg) => (<a onClick={() => {
                if (!formRef.current) {
                    return
                }
                const networks = formRef.current.getFieldValue('networks')
                const newNetworks = networks.filter((item: any) => item.multus !== cfg.multus)
                formRef.current.setFieldValue('networks', newNetworks)
            }}>移除</a>)
        }
    ]
    return networkColumns
}
