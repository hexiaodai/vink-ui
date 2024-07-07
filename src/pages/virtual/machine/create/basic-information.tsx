import React from 'react'
import { Form, Input, Space, Select, Card } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import { NamespaceManagement } from '@/apis-management/namespace'
import { ListOptions } from '@/utils/search'

interface BasicInformationProps {
    onSelectCallback?: (namespace: string) => void
}

class BasicInformationHandler {
    private props: BasicInformationProps

    constructor(props: BasicInformationProps) {
        this.props = props
    }

    validateName = (name: string) => {
        // 仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 16 个字符
        const pattern = /^[a-z]([-a-z0-9]{0,14}[a-z0-9])?$/
        if (name && pattern.test(name)) {
            return Promise.resolve()
        }
        return Promise.reject(new Error("only allows lowercase letters, numbers, and hyphens (-), must start and end with a letter, and be no longer than 16 characters."))
    }

    validateNamespace = (name: string) => {
        // 仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 63 个字符
        const pattern = /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/
        if (name && pattern.test(name)) {
            return Promise.resolve()
        }
        return Promise.reject(new Error("only allows lowercase letters, numbers, and hyphens (-), must start and end with a letter, and be no longer than 63 characters."))
    }

    selectNamespace = (namespace: string) => {
        if (this.props.onSelectCallback) {
            this.props.onSelectCallback(namespace)
        }
    }

    useNamespaces = (opts: ListOptions) => {
        return NamespaceManagement.UseNamespaces(opts)
    }
}

const BasicInformation: React.FC<BasicInformationProps> = ({ onSelectCallback }) => {
    const handler = new BasicInformationHandler({ onSelectCallback })

    const { data, fetchData, loading, notificationContext } = handler.useNamespaces({})

    return (
        <div>
            {notificationContext}
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
                        rules={[{ required: true, message: '', validator: (_: any, value: string) => handler.validateNamespace(value) }]}
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
                            onSelect={(value) => handler.selectNamespace(value)}
                            onClick={() => fetchData()}
                            options={data.map((ns) => ({ value: ns.name, label: ns.name }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="name"
                        label="名称"
                        rules={[{ required: true, message: '', validator: (_: any, value: string) => handler.validateName(value) }]}
                        tooltip="仅允许使用小写字母、数字和短横线（-），且必须以字母开头和结尾，长度不超过 16 个字符。"
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
