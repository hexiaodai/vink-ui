import { Form, InputNumber, Space, Card } from 'antd'
import formItem from '@/common/styles/form-item.module.less'
import { classNames } from '@/utils/utils'

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
                    className={formItem.mb0}
                >
                    <InputNumber min={1} addonAfter="Core" className={formItem.dw} />
                </Form.Item>

                <Form.Item
                    name="memory"
                    label="内存"
                    tooltip="虚拟机内存大小。"
                    rules={[{ required: true, message: '' }]}
                    className={classNames(formItem.mb0)}
                >
                    <InputNumber min={1} addonAfter="Gi" className={formItem.dw} />
                </Form.Item>
            </Space>
        </Card >
    )
}

export default CPUMemory
