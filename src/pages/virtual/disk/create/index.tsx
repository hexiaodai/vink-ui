import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, InputNumber, Space } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultNamespace } from '@/utils/k8s'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { createDataDisk, updateNamespaces } from './resource-manager'
import { imageYaml } from './constant'
import { useNavigate } from 'react-router-dom'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import Styles from '@/pages/virtual/machine/create/styles/index.module.less'

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
                instance.spec.pvc.resources.requests.storage = `${fields.dataDiskCapacity}Gi`

                instance.metadata.labels[labels.VinkDatavolumeType.name] = "data"

                console.log(instance)

                await createDataDisk(instance, notification).then(() => {
                    navigate('/virtual/disks')
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
                        placeholder="输入数据盘名称"
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                            message: "名称只能包含小写字母、数字和连字符（-），且必须以字母开头和结尾，最大长度为 64 个字符。"
                        }]}
                    />
                    <ProFormItem
                        name="dataDiskCapacity"
                        label="数据盘容量"
                        initialValue={50}
                        rules={[{
                            required: true,
                            message: "请输入数据盘容量。"
                        }]}
                    >
                        <InputNumber<number>
                            min={1}
                            style={{ width: 250 }}
                            formatter={(value) => `${value} Gi`}
                            parser={(value) => value?.replace(' Gi', '') as unknown as number}
                        />
                    </ProFormItem>
                    <ProFormText
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入数据盘的简介，用于描述数据盘的用途。"
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}
