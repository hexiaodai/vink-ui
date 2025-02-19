import { FooterToolbar, ProCard, ProForm, ProFormCascader, ProFormItem, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, InputNumber, Space, AutoComplete } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { classNames } from '@/utils/utils'
import { newSystemImage } from '../../datavolume'
import type { ProFormInstance } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import formStyles from "@/common/styles/form.module.less"
import styles from "./styles/index.module.less"
import { create } from '@/clients/clients'

interface formValues {
    namespace: string
    name: string
    description: string
    operatingSystem: string[]
    imageSource: string
    imageCapacity: number
}

const imageSources: any = {
    "ubuntu": {
        "22.04": {
            "baseUrl": "https://cloud-images.ubuntu.com/jammy/current",
            "tags": [
                "jammy-server-cloudimg-amd64-disk-kvm.img",
                "jammy-server-cloudimg-amd64.img"
            ]
        }
    },
    "centos": {
        "10": {
            "baseUrl": "https://cloud.centos.org/centos/10-stream/images",
            "tags": [
                "CentOS-Stream-GenericCloud-10-latest.x86_64.qcow2"
            ]
        }
    },
    "debian": {
        "12": {
            "baseUrl": "https://cdimage.debian.org/cdimage/cloud/bookworm/latest",
            "tags": [
                "debian-12-generic-amd64.qcow2",
                "debian-12-genericcloud-amd64.qcow2",
                "debian-12-nocloud-amd64.qcow2"
            ]
        }
    }
}

const options = [
    {
        value: 'ubuntu',
        label: <OperatingSystem operatingSystem={{ name: "ubuntu", version: "" }} />,
        children: [
            {
                value: '20.04',
                label: '20.04',
            },
            {
                value: '22.04',
                label: '22.04',
            },
        ],
    },
    {
        value: 'centos',
        label: <OperatingSystem operatingSystem={{ name: "centos", version: "" }} />,
        children: [
            {
                value: '7',
                label: '7',
            },
            {
                value: '8',
                label: '8',
            },
            {
                value: '9',
                label: '9',
            },
            {
                value: '10',
                label: '10',
            }
        ],
    },
    {
        value: 'debian',
        label: <OperatingSystem operatingSystem={{ name: "debian", version: "" }} />,
        children: [
            {
                value: '9',
                label: '9',
            },
            {
                value: '10',
                label: '10',
            },
            {
                value: '11',
                label: '11',
            },
            {
                value: '12',
                label: '12',
            }
        ],
    },
    {
        value: 'linux',
        label: <OperatingSystem operatingSystem={{ name: "linux", version: "" }} />,
    },
    {
        value: 'windows',
        label: <OperatingSystem operatingSystem={{ name: "windows", version: "" }} />,
        children: [
            {
                value: '10',
                label: '10',
            },
            {
                value: '11',
                label: '11',
            }
        ]
    }
]

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance<formValues>>()

    const navigate = useNavigate()

    useEffect(() => {
        formRef.current?.setFieldsValue({ namespace: namespace })
        if (namespace) {
            formRef.current?.validateFields(["namespace"])
        }
    }, [namespace])

    const [imageSourceOptions, setImageSourceOptions] = useState<{ value: string }[]>([])

    const handleClick = () => {
        const fields = formRef.current?.getFieldsValue()
        if (!fields) {
            return
        }
        const family = fields.operatingSystem?.[0]
        const version = fields.operatingSystem?.[1]

        const imageSource = imageSources[family]?.[version]
        if (!imageSource) {
            return
        }

        const opts = []
        for (const tag of imageSource.tags) {
            opts.push({ value: `${imageSource.baseUrl}/${tag}` })
        }
        setImageSourceOptions(opts)
    }

    const handleSubmit = async () => {
        if (!formRef.current) {
            throw new Error("formRef is not initialized")
        }

        await formRef.current.validateFields()
        const fields = formRef.current.getFieldsValue()
        const ns = { namespace: fields.namespace, name: fields.name }
        const instance = newSystemImage(ns, fields.imageSource, fields.imageCapacity, fields.operatingSystem?.[0], fields.operatingSystem?.[1])

        await create(instance, undefined, undefined, notification)

        navigate('/virtual/images')
    }

    return (
        <ProForm
            className={classNames(formStyles["create-resource-form"], formStyles["required-label-right-indicator-form"])}
            labelCol={{ span: 4 }}
            layout="horizontal"
            labelAlign="left"
            colon={false}
            formRef={formRef}
            onReset={() => { }}
            submitter={{
                onSubmit: () => handleSubmit(),
                // no need to reset form
                render: (_, dom) => <FooterToolbar>{dom?.[1]}</FooterToolbar>
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
                        placeholder="输入镜像名称"
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                            message: "名称仅含小写字母、数字、连字符（-），且以字母开头和结尾，最长 64 字符"
                        }]}
                    />
                    <ProFormTextArea
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入虚拟机的简介"
                        fieldProps={{ rows: 2 }}
                    />
                </ProCard>

                <ProCard title="镜像" headerBordered className={styles["system-image"]}>
                    <ProFormCascader
                        name="operatingSystem"
                        label="操作系统"
                        width="lg"
                        placeholder="选择操作系统"
                        fieldProps={{ options: options }}
                        rules={[{
                            required: true,
                            message: "选择操作系统"
                        }]}
                    />
                    <ProFormItem
                        name="imageCapacity"
                        label="镜像容量"
                        initialValue={10}
                        rules={[{
                            required: true,
                            validator() {
                                const fields = formRef.current?.getFieldsValue()
                                const imageCapacity = fields?.imageCapacity

                                if (!imageCapacity || imageCapacity < 10) {
                                    return Promise.reject()
                                }
                                return Promise.resolve()
                            },
                            message: "镜像容量不能小于 10 Gi。"
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
                        name="imageSource"
                        label="镜像源"
                        tooltip="http(s)、s3、docker"
                        rules={[{
                            required: true,
                            pattern: /^(https?:\/\/|s3:\/\/|docker:\/\/)/,
                            message: "仅支持 http(s)、s3、docker"
                        }]}
                    >
                        <AutoComplete
                            style={{ width: 440 }}
                            options={imageSourceOptions}
                            placeholder="请选择或输入"
                            onClick={handleClick}
                        />
                    </ProFormItem>
                </ProCard>
            </Space>
        </ProForm >
    )
}
