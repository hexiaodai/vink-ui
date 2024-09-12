import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, Cascader, InputNumber, Space } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultNamespace } from '@/utils/k8s'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { createImage, updateNamespaces } from './resource-manager'
import { imageYaml } from './constant'
import { useNavigate } from 'react-router-dom'
import { IconFont } from '@/components/icon'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import Styles from '@/pages/virtual/machine/create/styles/index.module.less'

const options = [
    {
        value: 'ubuntu',
        label: <Space>
            <IconFont type={"icon-ubuntu"} />
            <span>Ubuntu</span>
        </Space>,
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
        label: <Space>
            <IconFont type={"icon-centos"} />
            <span>CentOS</span>
        </Space>,
        icons: <IconFont type={"icon-centos"} />,
        children: [
            {
                value: '7',
                label: '7',
            },
            {
                value: '8',
                label: '8',
            },
        ],
    },
    {
        value: 'debian',
        label: <Space>
            <IconFont type={"icon-debian"} />
            <span>Debian</span>
        </Space>,
        icons: <IconFont type={"icon-debian"} />,
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
        ],
    },
    {
        value: 'windows',
        label: <Space>
            <IconFont type={"icon-windows"} />
            <span>Windows</span>
        </Space>,
        icons: <IconFont type={"icon-windows"} />,
        children: [
            {
                value: '10',
                label: '10',
            },
            {
                value: '11',
                label: '11',
            },
        ],
    },
    {
        value: 'linux',
        label: <Space>
            <IconFont type={"icon-linux"} />
            <span>Linux</span>
        </Space>,
        icons: <IconFont type={"icon-linux"} />,
    }
]

export default () => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    const [namespaces, setNamespaces] = useState<CustomResourceDefinition[]>([])
    const updateNamespacesCallback = useCallback(updateNamespaces, [])

    useEffect(() => {
        updateNamespacesCallback(setNamespaces, notification)
    }, [])

    const submit = async () => {
        formRef.current?.
            validateFields({ validateOnly: false }).
            then(async () => {
                const fields = formRef.current?.getFieldsValue()

                console.log(fields)

                const instance: any = yaml.load(imageYaml)
                instance.metadata.name = fields.name
                instance.metadata.namespace = fields.namespace
                instance.spec.pvc.resources.requests.storage = `${fields.imageCapacity}Gi`
                instance.spec.source.registry.url = fields.imageSource

                instance.metadata.labels[labels.VinkDatavolumeType.name] = "image"
                instance.metadata.labels[labels.VinkVirtualmachineOs.name] = fields.operatingSystem[0]
                instance.metadata.labels[labels.VinkVirtualmachineVersion.name] = fields.operatingSystem[1]

                console.log(instance)

                await createImage(instance, notification).then(() => {
                    navigate('/virtual/images')
                })
            }).
            catch((err: any) => {
                const errorMessage = err.errorFields?.map((field: any, idx: number) => `${idx + 1}. ${field.errors}`).join('<br />') || `表单校验失败: ${err}`
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
            onReset={() => { }}
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
                        placeholder="输入镜像名称"
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                            message: "名称只能包含小写字母、数字和连字符（-），且必须以字母开头和结尾，最大长度为 64 个字符。"
                        }]}
                    />
                    <ProFormText
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入虚拟机的简介，用于描述系统镜像的用途。"
                    />
                </ProCard>

                <ProCard title="镜像" headerBordered>
                    <ProFormItem
                        name="operatingSystem"
                        label="操作系统"
                        rules={[{
                            required: true,
                            message: "请选择操作系统。"
                        }]}
                    >
                        <Cascader style={{ width: 250 }} options={options} placeholder="请选择操作系统" />
                    </ProFormItem>
                    <ProFormItem
                        name="imageCapacity"
                        label="镜像容量"
                        initialValue={10}
                        rules={[{
                            required: true,
                            validator() {
                                const imageCapacity = formRef.current?.getFieldValue("imageCapacity")
                                if (imageCapacity < 10) {
                                    return Promise.reject()
                                }
                                return Promise.resolve()
                            },
                            message: "镜像容量不能小于 10 Gi。"
                        }]}
                    >
                        <InputNumber<number>
                            min={10}
                            style={{ width: 250 }}
                            formatter={(value) => `${value} Gi`}
                            parser={(value) => value?.replace(' Gi', '') as unknown as number}
                        />
                    </ProFormItem>

                    <ProFormText
                        width="lg"
                        name="imageSource"
                        label="镜像源"
                        tooltip="HTTP(S)、S3、Docker. 例如: https://example.com, s3://example.com, docker://example.com"
                        placeholder="https://example.com"
                        rules={[{
                            required: true,
                            pattern: /^(http(s)?:\/\/|s3:\/\/|docker:\/\/)/,
                            message: "仅支持 http(s)、s3、docker。"
                        }]}
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}
