import React, { useState } from 'react'
import { Button, Form, Space, Row, Col } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import BasicInformation from '@/pages/virtual/machine/create/basic-information'
import OperatingSystem from '@/pages/virtual/machine/create/operating-system'
import CPUMemory from '@/pages/virtual/machine/create/cpu-mem'
import Storage from '@/pages/virtual/machine/create/storage'
import { VirtualMachineManagement } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useErrorNotification } from '@/components/notification'
import type { CreateVirtualMachineRequest, VirtualMachineConfigStorageDataVolume } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { useNavigate } from 'react-router-dom'
import commonFormStyles from '@/common/styles/form.module.less'

const Create: React.FC = () => {
    const [form] = Form.useForm()
    const values = Form.useWatch([], form)

    const [namespace, setNamespace] = useState<string>(defaultNamespace)
    const [submittable, setSubmittable] = React.useState<boolean>(false)

    const [loading, setLoading] = useState(false)
    const { contextHolder, showErrorNotification } = useErrorNotification()

    React.useEffect(() => {
        form
            .validateFields({ validateOnly: false })
            .then(() => setSubmittable(true))
            .catch(() => setSubmittable(false))
    }, [form, values])

    const navigate = useNavigate()

    const handleSelectNamespace = (namespace: string) => {
        setNamespace(namespace)
    }

    const handleSubmit = async (values: any) => {
        setLoading(true)
        const dataVolumes: VirtualMachineConfigStorageDataVolume[] = []
        values.dataVolumes?.forEach((item: any) => {
            dataVolumes.push({ ref: { name: item.name, namespace: item.namespace } })
        })
        try {
            const request: CreateVirtualMachineRequest = {
                namespace: values.namespace,
                name: values.name,
                config: {
                    storage: {
                        root: {
                            ref: {
                                namespace: values.operatingSystem?.namespace,
                                name: values.operatingSystem?.name
                            },
                            // TODO: 
                            capacity: values.rootVolumeCapacity + "Gi",
                            storageClassName: "local-path"
                        },
                        data: dataVolumes,
                    },
                    compute: {
                        cpuCores: values.cpu,
                        // TODO:
                        memory: values.memory + "Gi"
                    },
                    userConfig: {
                        cloudInitBase64: "I2Nsb3VkLWNvbmZpZwpzc2hfcHdhdXRoOiB0cnVlCmRpc2FibGVfcm9vdDogZmFsc2UKY2hwYXNzd2Q6IHsibGlzdCI6ICJyb290OmRhbmdlcm91cyIsIGV4cGlyZTogRmFsc2V9CgpydW5jbWQ6CiAgLSBzZWQgLWkgIi8jXD9QZXJtaXRSb290TG9naW4vcy9eLiokL1Blcm1pdFJvb3RMb2dpbiB5ZXMvZyIgL2V0Yy9zc2gvc3NoZF9jb25maWcKICAtIHN5c3RlbWN0bCByZXN0YXJ0IHNzaGQuc2VydmljZQo="
                    }
                }
            }
            await VirtualMachineManagement.CreateVirtualMachine(request)
            navigate('/virtual/machines')
        } catch (err) {
            showErrorNotification('Create VirtualMachine', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {contextHolder}
            <Form
                className={commonFormStyles.form}
                form={form}
                onFinish={handleSubmit}
                name="virtualmachine"
                initialValues={{ namespace: namespace, cpu: 2, memory: 4, rootVolumeCapacity: 40 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="small" direction="vertical"
                >
                    <BasicInformation onSelectCallback={handleSelectNamespace} />

                    <OperatingSystem form={form} namespace={namespace} />

                    <CPUMemory />

                    <Storage form={form} namespace={namespace} />

                    <Form.Item
                        wrapperCol={{ span: 23 }}
                        className={commonFormStyles['submit-item']}
                    >
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
        </div>
    )
}

export default Create
