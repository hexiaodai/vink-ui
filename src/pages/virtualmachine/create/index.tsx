import React, { useState } from 'react'
import { Button, Form, Space, Row, Col } from 'antd'
import { DefaultNamespace } from '@/utils/k8s'
import BasicInformation from '@/pages/virtualmachine/create/basic-information'
import OperatingSystem from '@/pages/virtualmachine/create/operating-system'
import CPUMemory from '@/pages/virtualmachine/create/cpu-mem'
import Storage from '@/pages/virtualmachine/create/storage'
import { VirtualMachineManagement } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'

import type { CreateVirtualMachineRequest } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useErrorNotification } from '@/common/notification'
import { sleep } from '@/utils/time'

const Create: React.FC = () => {
    const [form] = Form.useForm()
    const values = Form.useWatch([], form)

    const [namespace, setNamespace] = useState<string>(DefaultNamespace)
    const [submittable, setSubmittable] = React.useState<boolean>(false)

    const [loading, setLoading] = useState(false)
    const { contextHolder, showErrorNotification } = useErrorNotification()

    React.useEffect(() => {
        form
            .validateFields({ validateOnly: false })
            .then(() => setSubmittable(true))
            .catch(() => setSubmittable(false))
    }, [form, values])

    const handleSelectNamespace = (namespace: string) => {
        setNamespace(namespace)
    }

    const handleSubmit = async (values: any) => {
        setLoading(true)
        try {
            const request: CreateVirtualMachineRequest = {
                namespace: values.namespace,
                name: values.name,
                config: {
                    storage: {
                        bootDisk: {
                            dataVolumeRef: {
                                namespace: values.os.namespace,
                                name: values.os.name
                            },
                            // FIXME:
                            capacity: values.rootdisk + "Gi",
                            storageClassName: "local-path"
                        }
                    },
                    resources: {
                        cpuCores: values.cpu,
                        // FIXME:
                        memory: values.memory + "Gi"
                    },
                    userConfig: {
                        cloudInitBase64: "I2Nsb3VkLWNvbmZpZwpzc2hfcHdhdXRoOiB0cnVlCmRpc2FibGVfcm9vdDogZmFsc2UKY2hwYXNzd2Q6IHsibGlzdCI6ICJyb290OmRhbmdlcm91cyIsIGV4cGlyZTogRmFsc2V9CgpydW5jbWQ6CiAgLSBzZWQgLWkgIi8jXD9QZXJtaXRSb290TG9naW4vcy9eLiokL1Blcm1pdFJvb3RMb2dpbiB5ZXMvZyIgL2V0Yy9zc2gvc3NoZF9jb25maWcKICAtIHN5c3RlbWN0bCByZXN0YXJ0IHNzaGQuc2VydmljZQo="
                    }
                }
            }
            const response = await VirtualMachineManagement.CreateVirtualMachine(request)
        } catch (err) {
            showErrorNotification('Create VirtualMachine', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div>{contextHolder}</div>
            <Form
                form={form}
                onFinish={handleSubmit}
                name="createvirtualmachine"
                initialValues={{ namespace: namespace, cpu: 2, memory: 4, rootdisk: 40 }}
                layout='vertical'
            >
                <Space size="middle" direction="vertical" style={{ width: '100%' }}>
                    <BasicInformation onSelectCallback={handleSelectNamespace} />

                    <OperatingSystem form={form} namespace={namespace} />

                    <CPUMemory />

                    <Storage form={form} namespace={namespace} />

                    <Form.Item wrapperCol={{ span: 23 }} style={{ marginTop: 24 }}>
                        <Row justify="end">
                            <Col>
                                <Button type="primary" htmlType="submit" disabled={!submittable || loading}>
                                    创建虚拟机
                                </Button>
                            </Col>
                        </Row>
                    </Form.Item>
                </Space>
            </Form >
        </>
    )
}

export default Create
