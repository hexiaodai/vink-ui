import { Form, InputNumber, Space, Card } from 'antd'

const CPUMemory = () => {
    return (
        <Card
            title="处理器和内存"
            bordered={false}
        >
            <Space wrap={true} size="large">
                <Form.Item
                    name="cpu"
                    label="处理器"
                    tooltip="虚拟机处理器核心数。"
                    rules={[{ required: true, message: '' }]}
                >
                    <InputNumber
                        min={1}
                        addonAfter="Core"
                    />
                </Form.Item>

                <Form.Item
                    name="memory"
                    label="内存"
                    tooltip="虚拟机内存大小。"
                    rules={[{ required: true, message: '' }]}
                >
                    <InputNumber
                        min={1}
                        addonAfter="Gi"
                    />
                </Form.Item>
            </Space>
        </Card >
    )
}

export default CPUMemory
