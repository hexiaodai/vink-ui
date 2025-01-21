import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormText } from '@ant-design/pro-components'
import { App, Button, Divider, Flex, InputNumber, Space, Table, TableProps } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey, parseMemoryValue } from '@/utils/k8s'
import { classNames } from '@/utils/utils'
import { DataDiskDrawer } from '@/pages/compute/machine/components/data-disk-drawer'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { PlusOutlined } from '@ant-design/icons'
import { newVirtualMachine } from '../virtualmachine'
import { NetworkDrawer } from '../components/network-drawer'
import { defaultCloudInit } from '../virtualmachine'
import { RootDiskDrawer } from '../components/root-disk-drawer'
import { DataVolume } from '@/clients/data-volume'
import { createVirtualMachine } from '@/clients/virtual-machine'
import { VirtualMachineNetworkType } from '@/clients/subnet'
import type { ProFormInstance } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import styles from '@/pages/compute/machine/create/styles/index.module.less'
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import formStyles from "@/common/styles/form.module.less"
import commonStyles from "@/common/styles/common.module.less"

type formValues = {
    name: string
    namespace: string
    cpu: number
    memory: number
    rootDisk: DataVolume
    rootDiskCapacity: number
    dataDisks: DataVolume[]
    networks: VirtualMachineNetworkType[]
    cloudInit: string
}

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance<formValues>>()

    const navigate = useNavigate()

    const [openDrawer, setOpenDrawer] = useState({ rootDisk: false, network: false, dataDisk: false })

    const [selected, setSelected] = useState<{ dataDisks: DataVolume[] | undefined, networks: VirtualMachineNetworkType[] | undefined }>({ dataDisks: undefined, networks: undefined })

    useEffect(() => {
        formRef.current?.setFieldsValue({ namespace: namespace })
    }, [namespace])

    useEffect(() => {
        return formRef.current?.setFieldsValue({ cloudInit: defaultCloudInit })
    }, [defaultCloudInit])

    const handleSubmit = async () => {
        if (!formRef.current) {
            throw new Error("formRef is not initialized")
        }

        await formRef.current.validateFields()
        const fields = formRef.current.getFieldsValue()

        const ns = { name: fields.name, namespace: fields.namespace }
        const cpuMem = { cpu: fields.cpu, memory: fields.memory }
        const rootDisk = { image: fields.rootDisk, capacity: fields.rootDiskCapacity }
        const instance = newVirtualMachine(ns, cpuMem, rootDisk, fields.dataDisks || [], fields.networks, fields.cloudInit)

        await createVirtualMachine(instance, undefined, undefined, notification)

        navigate('/compute/machines')
    }

    const dataDiskColumns: TableProps<DataVolume>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => dv.metadata!.name
        },
        {
            title: '存储类',
            key: 'storageClassName',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.storageClassName
        },
        {
            title: '访问模式',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.accessModes?.[0]
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => dv.spec.pvc?.resources?.requests?.storage
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (<a onClick={() => {
                const dataDisks = formRef.current?.getFieldsValue().dataDisks
                const newDisks = dataDisks?.filter((item) => namespaceNameKey(item) !== namespaceNameKey(dv))
                formRef.current?.setFieldsValue({ dataDisks: newDisks })
                setSelected(pre => ({ ...pre, dataDisks: newDisks }))
            }}>移除</a>)
        }
    ]

    const networkColumns: TableProps<VirtualMachineNetworkType>['columns'] = [
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
            render: (_, cfg) => {
                if (typeof cfg.subnet === 'object') {
                    return cfg.subnet?.spec?.vpc
                }
            }
        },
        {
            title: '子网',
            key: 'subnet',
            ellipsis: true,
            render: (_, cfg) => typeof cfg.subnet === 'string' ? cfg.subnet : cfg.subnet?.metadata!.name
        },
        {
            title: 'IP 地址池',
            key: 'ippool',
            ellipsis: true,
            render: (_, cfg) => {
                const ippool = typeof cfg.ippool === 'string' ? cfg.ippool : cfg.ippool?.metadata!.name
                return ippool || "自动分配"
            },
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
                const networks = formRef.current?.getFieldsValue().networks
                const newNetworks = networks?.filter((item) => namespaceNameKey(item.multus) !== namespaceNameKey(cfg.multus))
                formRef.current?.setFieldsValue({ networks: newNetworks })
                setSelected(pre => ({ ...pre, networks: newNetworks }))
            }}>移除</a>)
        }
    ]

    return (
        <>
            <ProForm
                className={classNames(formStyles["create-resource-form"], formStyles["required-label-right-indicator-form"])}
                labelCol={{ span: 4 }}
                layout="horizontal"
                labelAlign="left"
                colon={false}
                formRef={formRef}
                submitter={{
                    onSubmit: handleSubmit,
                    // no need to reset form
                    render: (_, dom) => <FooterToolbar>{dom?.[1]}</FooterToolbar>
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
                                    return formRef.current?.getFieldsValue().rootDisk ? Promise.resolve() : Promise.reject()
                                },
                                message: "添加操作系统"
                            }]}
                        >
                            <Space size="large" direction='vertical'>
                                {
                                    formRef.current?.getFieldsValue().rootDisk ? (
                                        <Flex align='center' style={{ height: 32 }}>
                                            <OperatingSystem dv={formRef.current?.getFieldsValue().rootDisk} />
                                            <Divider type="vertical" />
                                            <span>{formRef.current?.getFieldsValue().rootDisk?.metadata!.name}</span>
                                            <Divider type="vertical" />
                                            <span>{formRef.current?.getFieldsValue().rootDisk?.spec?.pvc?.resources?.requests?.storage}</span>
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
                        <ProFormItem
                            label="处理器"
                            name="cpu"
                            initialValue={2}
                            rules={[{
                                required: true,
                                message: "输入处理器核心数"
                            }]}
                        >
                            <InputNumber<number>
                                min={1}
                                max={1024}
                                step={1}
                                style={{ width: 440 }}
                                formatter={(value) => `${value} Core`}
                                parser={(value) => value?.replace(' Core', '') as unknown as number}
                            />
                        </ProFormItem>

                        <ProFormItem
                            label="内存"
                            name="memory"
                            initialValue={4}
                            rules={[{
                                required: true,
                                message: "输入内存大小"
                            }]}
                        >
                            <InputNumber<number>
                                min={1}
                                max={1024}
                                step={1}
                                style={{ width: 440 }}
                                formatter={(value) => `${value} Gi`}
                                parser={(value) => value?.replace(' Gi', '') as unknown as number}
                            />
                        </ProFormItem>
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
                                    const fields = formRef.current?.getFieldsValue()
                                    const rootDiskCapacity = fields?.rootDiskCapacity
                                    const rootDiskStorage = fields?.rootDisk?.spec?.pvc?.resources?.requests?.storage
                                    if (!rootDiskStorage || !rootDiskCapacity) {
                                        return Promise.resolve()
                                    }

                                    let value = 0
                                    if (typeof rootDiskStorage === "string") {
                                        const parse = parseMemoryValue(rootDiskStorage)
                                        if (parse) {
                                            value = parse[0]
                                        }
                                    } else {
                                        value = rootDiskStorage
                                    }

                                    if (rootDiskCapacity <= value) {
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
                                (selected.dataDisks && selected.dataDisks.length > 0) && (
                                    <Table
                                        size="small"
                                        style={{ marginBottom: 24 }}
                                        columns={dataDiskColumns}
                                        dataSource={selected.dataDisks}
                                        pagination={false}
                                        rowKey={(dv) => namespaceNameKey(dv)}
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
                                    const networks = formRef.current?.getFieldsValue().networks
                                    if (!networks || networks.length == 0) {
                                        return Promise.reject()
                                    }
                                    return Promise.resolve()
                                },
                                message: "添加网络接口"
                            }]}
                        >
                            {
                                (selected.networks && selected.networks.length > 0) && (
                                    <Table
                                        size="small"
                                        className={commonStyles["small-scrollbar"]}
                                        scroll={{ x: 1300 }}
                                        style={{ marginBottom: 24 }}
                                        columns={networkColumns}
                                        dataSource={selected.networks}
                                        pagination={false}
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
                                    formRef.current?.setFieldsValue({ cloudInit: value })
                                }}
                            />
                        </ProFormItem>
                    </ProCard>
                </Space>
            </ProForm >

            <RootDiskDrawer
                open={openDrawer.rootDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, rootDisk: false }))}
                current={formRef.current?.getFieldsValue().rootDisk}
                onConfirm={(data) => {
                    setOpenDrawer((prevState) => ({ ...prevState, rootDisk: false }))
                    formRef.current?.setFieldsValue({ rootDisk: data })
                    formRef.current?.validateFields(["rootDisk"])
                }}
            />

            <DataDiskDrawer
                open={openDrawer.dataDisk}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))}
                current={selected.dataDisks}
                onConfirm={(data) => {
                    setOpenDrawer((prevState) => ({ ...prevState, dataDisk: false }))
                    formRef.current?.setFieldsValue({ dataDisks: data })
                    formRef.current?.validateFields(["dataDisks"])
                    setSelected(pre => ({ ...pre, dataDisks: data }))
                }}
            />

            <NetworkDrawer
                open={openDrawer.network}
                onCanel={() => setOpenDrawer((prevState) => ({ ...prevState, network: false }))}
                onConfirm={(data) => {
                    const networks = formRef.current?.getFieldsValue().networks || []
                    const hasElement = networks.some((cfg: any) => {
                        return namespaceNameKey(cfg.multus) === namespaceNameKey(data.multus)
                    })
                    if (hasElement) {
                        return
                    }
                    const newNetworks = networks.concat(data)
                    setOpenDrawer((prevState) => ({ ...prevState, network: false }))
                    formRef.current?.setFieldsValue({ networks: newNetworks })
                    formRef.current?.validateFields(["networks"])
                    setSelected(pre => ({ ...pre, networks: newNetworks }))
                }}
            />
        </>
    )
}
