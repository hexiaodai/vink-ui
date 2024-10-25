import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, Button, InputNumber, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { diskYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { useNamespace } from '@/common/context'
import { classNames } from '@/utils/utils'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { clients } from '@/clients/clients'
import { PlusOutlined } from '@ant-design/icons'
import type { ProFormInstance } from '@ant-design/pro-components'
import formStyles from "@/common/styles/form.module.less"
import * as yaml from 'js-yaml'

const defaultAccessMode = "ReadWriteOnce"
const defaultStorageClass = "local-path"

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance>()

    const navigate = useNavigate()

    const [storageClass, setStorageClass] = useState<any[]>([])
    const [enableCustomStorageClass, setEnableCustomStorageClass] = useState(false)
    const [enableCustomAccessMode, setEnableCustomAccessMode] = useState(false)

    useEffect(() => {
        formRef.current?.setFieldsValue({
            namespace: namespace
        })
    }, [namespace])

    useEffect(() => {
        if (!enableCustomStorageClass) {
            return
        }
        clients.fetchResources(GroupVersionResourceEnum.STORAGE_CLASS).then((items) => {
            setStorageClass(items)
        }).catch(err => {
            notification.error({ message: err })
        })
    }, [enableCustomStorageClass])

    const submit = async () => {
        formRef.current?.
            validateFields({ validateOnly: false }).
            then(async () => {
                const fields = formRef.current?.getFieldsValue()

                const instance: any = yaml.load(diskYaml)
                instance.metadata.name = fields.name
                instance.metadata.namespace = fields.namespace
                instance.spec.pvc.resources.requests.storage = `${fields.dataDiskCapacity}Gi`

                instance.spec.pvc.accessModes = [(fields.accessMode && fields.accessMode.length > 0) ? fields.accessMode : defaultAccessMode]
                instance.spec.pvc.storageClassName = (fields.storageClass && fields.storageClass.length > 0) ? fields.storageClass : defaultStorageClass
                instance.metadata.labels[labels.VinkDatavolumeType.name] = "data"

                await clients.createResource(GroupVersionResourceEnum.DATA_VOLUME, instance, { notification: notification }).then(() => {
                    navigate('/storage/disks')
                })
            }).
            catch((err: any) => {
                const errorMessage = err.errorFields?.map((field: any, idx: number) => `${idx + 1}. ${field.errors}`).join('<br />') || err
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
                            message: "命名空间仅含小写字母、数字、连字符（-），且以字母开头和结尾，最长 64 字符"
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
                            message: "名称仅含小写字母、数字、连字符（-），且以字母开头和结尾，最长 64 字符"
                        }]}
                    />

                    <ProFormItem
                        name="dataDiskCapacity"
                        label="数据盘容量"
                        initialValue={50}
                        rules={[{
                            required: true,
                            message: "输入数据盘容量"
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

                    <ProFormItem label="存储类">
                        {
                            enableCustomStorageClass &&
                            <ProFormSelect
                                width="lg"
                                name="storageClass"
                                placeholder="选择存储类"
                                options={[
                                    ...storageClass.map((ns: any) => ({
                                        value: ns.metadata.name,
                                        label: ns.metadata.name
                                    }))
                                ]}
                            />
                        }
                        <Button
                            color="default"
                            icon={<PlusOutlined />}
                            variant="text"
                            onClick={() => {
                                formRef.current?.resetFields(["storageClass"])
                                setEnableCustomStorageClass(!enableCustomStorageClass)
                            }}
                        >
                            {enableCustomStorageClass ? "使用默认存储类" : "自定义存储类"}
                        </Button>
                    </ProFormItem>

                    <ProFormItem label="访问模式">
                        {
                            enableCustomAccessMode &&
                            <ProFormSelect
                                width="lg"
                                name="accessMode"
                                placeholder="选择访问模式"
                                options={[
                                    {
                                        value: "ReadWriteOnce",
                                        label: "ReadWriteOnce"
                                    },
                                    {
                                        value: "ReadOnlyMany",
                                        label: "ReadOnlyMany"
                                    },
                                    {
                                        value: "ReadWriteMany",
                                        label: "ReadWriteMany"
                                    },
                                    {
                                        value: "ReadWriteOncePod",
                                        label: "ReadWriteOncePod"
                                    }
                                ]}
                            />
                        }
                        <Button
                            color="default"
                            icon={<PlusOutlined />}
                            variant="text"
                            onClick={() => {
                                formRef.current?.resetFields(["accessMode"])
                                setEnableCustomAccessMode(!enableCustomAccessMode)
                            }}
                        >
                            {enableCustomAccessMode ? "使用默认访问模式" : "自定义访问模式"}
                        </Button>
                    </ProFormItem>

                    <ProFormTextArea
                        width="lg"
                        name="description"
                        label="简介"
                        placeholder="输入数据盘的简介"
                        fieldProps={{ rows: 2 }}
                    />
                </ProCard>
            </Space>
        </ProForm >
    )
}
