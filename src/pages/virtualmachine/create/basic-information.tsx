import React from 'react'
import { Form, Input, Space, Select, Card } from 'antd'
import { DefaultNamespace } from '@/utils/k8s'
import { useNamespaces } from '@/apis/namespace'
import formItemStyles from '@/common/styles/form-item.module.less'
import { classNames } from '@/utils/utils'

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

const validateNamespace = (_: any, value: string) => {
    // 仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 63 个字符
    const pattern = /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/
    if (value && pattern.test(value)) {
        return Promise.resolve()
    }
    return Promise.reject(new Error('namespace must start with a letter and end with a letter or number, and can only contain letters, numbers, and hyphens (-).'))
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
                title={
                    <Space>
                        <span>基本信息</span>
                    </Space>
                }
                bordered={false}
            >
                <Space wrap={true} size="large">
                    <Form.Item
                        name="namespace"
                        label="命名空间"
                        tooltip="命名空间是 Kubernetes 集群中用于资源隔离和访问控制的基本单元。请选择一个已存在的命名空间，或者创建一个新的命名空间。"
                        rules={[{ required: true, message: '', validator: validateNamespace }]}
                        className={classNames(formItemStyles.dw, formItemStyles.mb0)}
                    >
                        <Select
                            showSearch
                            loading={loading}
                            className={formItemStyles.dw}
                            placeholder='选择命名空间'
                            defaultValue={DefaultNamespace}
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
                        className={classNames(formItemStyles.dw, formItemStyles.mb0)}
                    >
                        <Input
                            placeholder="输入虚拟机的名称"
                            maxLength={16}
                        />
                    </Form.Item>
                </Space>
            </Card>
        </div>
    )
}

export default BasicInformation
