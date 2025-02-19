import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, Button, InputNumber, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { classNames } from '@/utils/utils'
import { newDataDisk } from '../../datavolume'
import type { ProFormInstance } from '@ant-design/pro-components'
import formStyles from "@/common/styles/form.module.less"
import { create, list } from '@/clients/clients'
import { StorageClass } from '@/clients/storage-class'
import { ResourceType } from '@/clients/ts/types/types'

interface formValues {
    namespace: string
    name: string
    dataDiskCapacity: number
    storageClass: string
    accessMode: string
    description: string
}

const accessModeOptions = [
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
]

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const formRef = useRef<ProFormInstance<formValues>>()

    const navigate = useNavigate()

    const [storageClass, setStorageClass] = useState<StorageClass[]>()

    const [enableOpts, setEnableOpts] = useState<{ storageClass: boolean, accessMode: boolean }>({ storageClass: false, accessMode: false })

    useEffect(() => {
        formRef.current?.setFieldsValue({ namespace: namespace })
    }, [namespace])

    useEffect(() => {
        if (!enableOpts.storageClass) return
        list<StorageClass>(ResourceType.STORAGE_CLASS, setStorageClass, undefined, undefined, notification)
    }, [enableOpts.storageClass])

    const handleSubmit = async () => {
        if (!formRef.current) {
            throw new Error("formRef is not initialized")
        }

        await formRef.current.validateFields()
        const fields = formRef.current.getFieldsValue()
        const ns = { namespace: fields.namespace, name: fields.name }
        const instance = newDataDisk(ns, fields.dataDiskCapacity, fields.storageClass, fields.accessMode)
        await create(instance, undefined, undefined, notification)

        navigate('/virtual/disks')
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
                            enableOpts.storageClass &&
                            <ProFormSelect
                                width="lg"
                                name="storageClass"
                                placeholder="选择存储类"
                                options={
                                    (storageClass || []).map((sc) => ({
                                        value: sc.metadata.name,
                                        label: sc.metadata.name
                                    }))
                                }
                            />
                        }
                        <Button
                            color="default"
                            icon={<PlusOutlined />}
                            variant="text"
                            onClick={() => {
                                formRef.current?.resetFields(["storageClass"])
                                setEnableOpts((pre) => ({ ...pre, storageClass: !pre.storageClass }))
                            }}
                        >
                            {enableOpts.storageClass ? "使用默认存储类" : "自定义存储类"}
                        </Button>
                    </ProFormItem>

                    <ProFormItem label="访问模式">
                        {
                            enableOpts.accessMode &&
                            <ProFormSelect
                                width="lg"
                                name="accessMode"
                                placeholder="选择访问模式"
                                options={accessModeOptions}
                            />
                        }
                        <Button
                            color="default"
                            icon={<PlusOutlined />}
                            variant="text"
                            onClick={() => {
                                formRef.current?.resetFields(["accessMode"])
                                setEnableOpts((pre) => ({ ...pre, accessMode: !pre.accessMode }))
                            }}
                        >
                            {enableOpts.accessMode ? "使用默认访问模式" : "自定义访问模式"}
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
