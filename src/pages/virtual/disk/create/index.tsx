import React, { useState } from 'react'
import { Button, Form, Space, Row, Col } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import BasicInformation from '@/pages/virtual/disk/create/basic-information'
import { CreateDataVolumeRequest, DataVolumeManagement, DataVolumeType } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
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
                    dataVolumeType: DataVolumeType.DATA,
                    dataSource: {
                        blank: {},
                    },
                    boundPvc: {
                        storageClassName: 'local-path',
                        capacity: '10Gi'
                    }
                }
            }
            await DataVolumeManagement.CreateDataVolume(request)
            navigate('/virtual/disks')
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
                initialValues={{ namespace: namespace, dataVolumeCapacity: 40 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="small"
                    direction="vertical"
                >
                    <BasicInformation onSelectCallback={handleSelectNamespace} />

                    <Form.Item wrapperCol={{ span: 23 }} className={commonFormStyles['submit-item']}>
                        <Row justify="end">
                            <Col>
                                <Button type="primary" htmlType="submit" disabled={!submittable || loading}>
                                    创建磁盘
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
