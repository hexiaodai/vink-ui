import React from 'react'
import { Form, Input, Space, Select, Card, InputNumber } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import { useNamespaces } from '@/apis/namespace'
import TextArea from 'antd/es/input/TextArea'

interface BasicInformationProps {
    onSelectCallback?: (namespace: string) => void
}

const validateName = (_: any, value: string) => {
    // 仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 16 个字符
    const pattern = /^[a-z]([-a-z0-9]{0,14}[a-z0-9])?$/
    if (value && pattern.test(value)) {
        return Promise.resolve()
    }
    return Promise.reject(new Error('name must start with a letter and end with a letter or number, and can only contain letters, numbers, and hyphens (-).'))
}

const BasicInformation: React.FC<BasicInformationProps> = ({ onSelectCallback }) => {
    const { data, fetchData, loading, contextHolder } = useNamespaces({})

    const handleSelect = (namespace: string) => {
        if (onSelectCallback) onSelectCallback(namespace)
    }

    return (
        <div>
            {contextHolder}
            <Card
                title="基本信息"
                bordered={false}
            >
                <Space direction='vertical' wrap={true} size="large">
                    <Space wrap={true} size="large">
                        <Form.Item
                            name="namespace"
                            label="命名空间"
                            tooltip="命名空间是 Kubernetes 集群中用于资源隔离和访问控制的基本单元。请选择一个已存在的命名空间，或者创建一个新的命名空间。"
                            rules={[{ required: true, message: '' }]}
                        >
                            <Select
                                showSearch
                                loading={loading}
                                placeholder='选择命名空间'
                                defaultValue={defaultNamespace}
                                optionFilterProp="label"
                                filterOption={(input, option) => (option?.label ?? '').includes(input)}
                                filterSort={(optionA, optionB) =>
                                    (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                                }
                                onSelect={(value) => handleSelect(value)}
                                onClick={() => fetchData()}
                                options={data.map((ns) => ({ value: ns.name, label: ns.name }))}
                            />
                        </Form.Item>
                        <Form.Item
                            name="name"
                            label="名称"
                            rules={[{ required: true, message: '', validator: validateName }]}
                            tooltip="仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 16 个字符。"
                        >
                            <Input
                                placeholder="输入磁盘名称"
                                maxLength={16}
                            />
                        </Form.Item>
                    </Space>

                    <Space wrap={true} size="large">
                        <Form.Item
                            name="diskVolumeCapacity"
                            label="镜像容量"
                            rules={[{ required: true, message: '' }]}
                        >
                            <InputNumber min={10} style={{ width: 265 }} addonAfter="Gi" />
                        </Form.Item>
                    </Space>

                    <Space wrap={true} size="large">
                        <Form.Item
                            name="description"
                            label="简介"
                        >
                            <TextArea maxLength={100} placeholder="输入磁盘的简介" />
                        </Form.Item>
                    </Space>
                </Space>
            </Card>
        </div>
    )
}

export default BasicInformation
