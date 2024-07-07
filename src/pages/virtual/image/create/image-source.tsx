import React from 'react'
import { Form, Input, Space, Card, Cascader, InputNumber } from 'antd'
import { IconFont } from '@/components/icon'

interface BasicInformationProps { }

class BasicInformationHandler {
    private props: BasicInformationProps

    constructor(props: BasicInformationProps) {
        this.props = props
    }

    validateImageSource = (value: string) => {
        const regex = /^(http(s)?:\/\/|s3:\/\/|docker:\/\/)/
        if (!regex.test(value)) {
            return Promise.reject(new Error('仅支持 http(s)、s3、docker'))
        }
        return Promise.resolve()
    }
}

const BasicInformation: React.FC<BasicInformationProps> = () => {
    const handler = new BasicInformationHandler({})

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
        },
    ]

    return (
        <div>
            <Card
                title="镜像"
                bordered={false}
            >
                <Space direction="vertical" size="large">
                    <Space wrap={true} size="large">
                        <Form.Item
                            name="operatingSystem"
                            label="操作系统"
                            tooltip="操作系统类型"
                            rules={[{ required: true, message: '' }]}
                        >
                            <Cascader options={options} placeholder="请选择操作系统" />
                        </Form.Item>

                        <Form.Item
                            name="imageVolumeCapacity"
                            label="镜像容量"
                            rules={[{ required: true, message: '' }]}
                            tooltip="建议大于镜像实际的容量。"
                        >
                            <InputNumber min={10} addonAfter="Gi" />
                        </Form.Item>
                    </Space>
                    <Space>
                        <Form.Item
                            name="imageSource"
                            label="镜像源"
                            rules={[{ required: true, message: '', validator: (_: any, value: string) => handler.validateImageSource(value) }]}
                            tooltip='HTTP(S)、S3、Docker. 例如: https://example.com, s3://example.com, docker://example.com'
                        >
                            <Input placeholder='https://example.com' />
                        </Form.Item>
                    </Space>
                </Space>
            </Card>
        </div>
    )
}

export default BasicInformation
