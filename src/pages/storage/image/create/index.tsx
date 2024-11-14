import { FooterToolbar, ProCard, ProForm, ProFormCascader, ProFormItem, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, InputNumber, Space } from 'antd'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { classNames, getErrorMessage } from '@/utils/utils'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'
import { newSystemImage } from '../../datavolume'
import type { ProFormInstance } from '@ant-design/pro-components'
import OperatingSystem from '@/components/operating-system'
import formStyles from "@/common/styles/form.module.less"
import styles from "./styles/index.module.less"

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    useEffect(() => {
        formRef.current?.setFieldValue("namespace", namespace)
        if (namespace) {
            formRef.current?.validateFields(["namespace"])
        }
    }, [namespace])

    const handleSubmit = async () => {
        if (!formRef.current) {
            return
        }

        try {
            await formRef.current.validateFields()

            const fields = formRef.current.getFieldsValue()

            const namespaceName = { namespace: fields.namespace, name: fields.name }

            const instance = newSystemImage(
                namespaceName,
                fields.imageSource,
                fields.imageCapacity,
                fields.operatingSystem?.[0],
                fields.operatingSystem?.[1]
            )

            await clients.createResource(ResourceType.DATA_VOLUME, instance)
            navigate('/storage/images')
        } catch (err: any) {
            const errorMessage = err.errorFields?.map((field: any, idx: number) => `${idx + 1}. ${field.errors}`).join('<br />') || getErrorMessage(err)
            notification.error({
                message: getResourceName(ResourceType.DATA_VOLUME),
                description: (
                    <div dangerouslySetInnerHTML={{ __html: errorMessage }} />
                )
            })
        }
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
                            message: "仅支持 http(s)、s3、docker"
                        }]}
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}

const options = [
    {
        value: 'ubuntu',
        label: <OperatingSystem family="ubuntu" />,
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
        label: <OperatingSystem family="centos" />,
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
        label: <OperatingSystem family="debian" />,
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
        label: <OperatingSystem family="linux" />,
    },
    {
        value: 'windows',
        label: <OperatingSystem family="windows" />,
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
