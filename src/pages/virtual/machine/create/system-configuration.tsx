import React from 'react'
import { Form, Space, Card, FormInstance } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import commonFormStyles from '@/common/styles/form.module.less'

interface SystemConfigurationProps {
    form: FormInstance<any>
}

const defaultCloudInit = `
#cloud-config
ssh_pwauth: true
disable_root: false
chpasswd: {"list": "root:dangerous", expire: False}

runcmd:
- dhclient -r && dhclient
- sed -i "/#\?PermitRootLogin/s/^.*$/PermitRootLogin yes/g" /etc/ssh/sshd_config
- systemctl restart sshd.service
`

class SystemConfigurationHandler {
    private props: SystemConfigurationProps

    constructor(props: SystemConfigurationProps) {
        this.props = props
    }

    defaultCloudInit = () => {
        return defaultCloudInit.trim()
    }
}

const SystemConfiguration: React.FC<SystemConfigurationProps> = ({ form }) => {
    const handler = new SystemConfigurationHandler({ form })

    if (!form.getFieldValue('cloudInit')) {
        form.setFieldsValue({ cloudInit: handler.defaultCloudInit() })
    }

    return (
        <Card
            title={
                <Space>
                    <span>系统配置</span>
                </Space>
            }
            bordered={false}
        >
            <Form.Item
                style={{ width: 554 }}
                className={commonFormStyles["form-item-default-width"]}
                name="cloudInit"
                label="cloud-init"
                rules={[{ required: true, message: '' }]}
                tooltip="cloud-init is a tool for initializing cloud instances. It can be used to set up the initial state of a cloud instance, such as the hostname, user accounts, and network configuration."
            >
                <TextArea rows={9} placeholder="cloud-init" />
            </Form.Item>
        </Card>
    )
}

export default SystemConfiguration
