import { FooterToolbar, ProCard, ProForm, ProFormCascader, ProFormItem, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, InputNumber, Space } from 'antd'
import { useEffect, useRef } from 'react'
import { createDataVolume } from '@/resource-manager/datavolume'
import { imageYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { IconFont } from '@/components/icon'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { useNamespace } from '@/common/context'
import { classNames } from '@/utils/utils'
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import formStyles from "@/common/styles/form.module.less"

const options = [
    {
        value: 'ubuntu',
        label: <>
            <IconFont type={"icon-ubuntu"} />
            <span style={{ marginLeft: 8 }}>Ubuntu</span>
        </>,
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
        label: <>
            <IconFont type={"icon-centos"} />
            <span style={{ marginLeft: 8 }}>CentOS</span>
        </>,
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
        label: <>
            <IconFont type={"icon-debian"} />
            <span style={{ marginLeft: 8 }}>Debian</span>
        </>,
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
        value: 'linux',
        label: <>
            <IconFont type={"icon-linux"} />
            <span style={{ marginLeft: 8 }}>Linux</span>
        </>,
        icons: <IconFont type={"icon-linux"} />,
    },
    {
        value: 'windows',
        label: <>
            <IconFont type={"icon-windows"} />
            <span style={{ marginLeft: 8 }}>Windows</span>
        </>,
        icons: <IconFont type={"icon-windows"} />,
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

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    useEffect(() => {
        formRef.current?.setFieldValue("namespace", namespace)
    }, [namespace])

    const submit = async () => {
        formRef.current?.
            validateFields({ validateOnly: false }).
            then(async () => {
                const fields = formRef.current?.getFieldsValue()

                const instance: any = yaml.load(imageYaml)
                instance.metadata.name = fields.name
                instance.metadata.namespace = fields.namespace
                instance.spec.pvc.resources.requests.storage = `${fields.imageCapacity}Gi`
                instance.spec.source.registry.url = fields.imageSource

                instance.metadata.labels[labels.VinkDatavolumeType.name] = "image"
                instance.metadata.labels[labels.VinkVirtualmachineOs.name] = fields.operatingSystem[0]
                instance.metadata.labels[labels.VinkVirtualmachineVersion.name] = fields.operatingSystem[1]

                await createDataVolume(instance, notification).then(() => {
                    navigate('/storage/images')
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
            className={classNames(formStyles["create-resource-form"], formStyles["required-label-right-indicator-form"])}
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
                        placeholder="输入镜像名称"
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                            message: "名称只能包含小写字母、数字和连字符（-），且必须以字母开头和结尾，最大长度为 64 个字符。"
                        }]}
                    />
                    <ProFormTextArea
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入虚拟机的简介，用于描述系统镜像的用途。"
                        fieldProps={{ rows: 2 }}
                    />
                </ProCard>

                <ProCard title="镜像" headerBordered>
                    <ProFormCascader
                        name="operatingSystem"
                        label="操作系统"
                        width="lg"
                        fieldProps={{ options: options }}
                        rules={[{
                            required: true,
                            message: "选择操作系统。"
                        }]}
                    />
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
                            max={2048}
                            step={5}
                            style={{ width: 440 }}
                            formatter={(value) => `${value} Gi`}
                            parser={(value) => value?.replace(' Gi', '') as unknown as number}
                        />
                    </ProFormItem>

                    <ProFormText
                        width="lg"
                        name="imageSource"
                        label="镜像源"
                        tooltip="http(s)、s3、docker"
                        placeholder="scheme://example.com"
                        rules={[{
                            required: true,
                            pattern: /^(https?:\/\/|s3:\/\/|docker:\/\/)/,
                            message: "仅支持 http(s)、s3、docker。"
                        }]}
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}
