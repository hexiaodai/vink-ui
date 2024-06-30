import React, { useState } from 'react'
import { Button, Form, Space, Row, Col } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import BasicInformation from '@/pages/virtual/image/create/basic-information'
import ImageSource from '@/pages/virtual/image/create/image-source'
import { CreateDataVolumeRequest, DataVolumeManagement, DataVolumeType, OperatingSystemUbuntuVersion } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useErrorNotification } from '@/components/notification'
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
        try {
            const request: CreateDataVolumeRequest = {
                namespace: values.namespace,
                name: values.name,
                config: {
                    dataVolumeType: DataVolumeType.IMAGE,
                    operatingSystem: {
                        ubuntu: OperatingSystemUbuntuVersion.UBUNTU_22_04,
                    },
                    dataSource: {
                        http: {
                            url: values.imageSource,
                            headers: {}
                        },
                    },
                    boundPvc: {
                        storageClassName: 'local-path',
                        capacity: '10Gi'
                    }
                }
            }
            await DataVolumeManagement.CreateDataVolume(request)
            navigate('/virtual/images')
        } catch (err) {
            showErrorNotification('Create DataVolume', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div>{contextHolder}</div>
            <Form
                className={commonFormStyles.form}
                form={form}
                onFinish={handleSubmit}
                name="datavolume"
                initialValues={{ namespace: namespace, cpu: 2, memory: 4, rootVolumeCapacity: 40 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="small"
                    direction="vertical"
                >
                    <BasicInformation onSelectCallback={handleSelectNamespace} />

                    <ImageSource />

                    <Form.Item wrapperCol={{ span: 23 }} className={commonFormStyles['submit-item']}>
                        <Row justify="end">
                            <Col>
                                <Button type="primary" htmlType="submit" disabled={!submittable || loading}>
                                    创建镜像
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
