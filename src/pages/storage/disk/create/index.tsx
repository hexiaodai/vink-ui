import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, InputNumber, Space } from 'antd'
import { useEffect, useRef } from 'react'
import { createDataVolume } from '@/resource-manager/datavolume'
import { diskYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { useNamespace } from '@/common/context'
import { classNames } from '@/utils/utils'
import type { ProFormInstance } from '@ant-design/pro-components'
import * as yaml from 'js-yaml'
import formStyles from "@/common/styles/form.module.less"

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    useEffect(() => {
        formRef.current?.setFieldsValue({
            namespace: namespace
        })
    }, [namespace])

    const submit = async () => {
        formRef.current?.
            validateFields({ validateOnly: false }).
            then(async () => {
                const fields = formRef.current?.getFieldsValue()

                const instance: any = yaml.load(diskYaml)
                instance.metadata.name = fields.name
                instance.metadata.namespace = fields.namespace
                instance.spec.pvc.resources.requests.storage = `${fields.dataDiskCapacity}Gi`

                instance.metadata.labels[labels.VinkDatavolumeType.name] = "data"

                await createDataVolume(instance, notification).then(() => {
                    navigate('/storage/disks')
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
                            max={2048}
                            step={5}
                            style={{ width: 440 }}
                            formatter={(value) => `${value} Gi`}
                            parser={(value) => value?.replace(' Gi', '') as unknown as number}
                        />
                    </ProFormItem>
                    <ProFormTextArea
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入数据盘的简介，用于描述数据盘的用途"
                        fieldProps={{ rows: 2 }}
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}
