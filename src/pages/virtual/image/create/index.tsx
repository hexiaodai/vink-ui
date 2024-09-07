import React, { useState } from 'react'
import { Button, Form, Space, Row, Col, FormInstance } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import { CreateDataVolumeRequest, DataVolumeType, OperatingSystemUbuntuVersion } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useDataVolumeNotification, useErrorNotification } from '@/components/notification'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { DataVolumeManagement } from '../../../../../temp/apis-management/datavolume'
import BasicInformation from '@/pages/virtual/image/create/basic-information'
import ImageSource from '@/pages/virtual/image/create/image-source'
import commonFormStyles from '@/common/styles/form.module.less'

class ImageCreateHandler {
    private notification: any

    constructor(notification: any) {
        this.notification = notification
    }

    validateFields = (form: FormInstance<any>, setSubmittable: React.Dispatch<React.SetStateAction<boolean>>) => {
        form
            .validateFields({ validateOnly: false })
            .then(() => setSubmittable(true))
            .catch(() => setSubmittable(false))
    }

    selectNamespace = (setNamespace: React.Dispatch<React.SetStateAction<string>>, namespace: string) => {
        setNamespace(namespace)
    }

    submit = async (formValues: any, setLoading: React.Dispatch<React.SetStateAction<boolean>>, navigate: NavigateFunction) => {
        setLoading(true)

        const request: CreateDataVolumeRequest = {
            namespace: formValues.namespace,
            name: formValues.name,
            config: {
                dataVolumeType: DataVolumeType.IMAGE,
                operatingSystem: {
                    ubuntu: OperatingSystemUbuntuVersion.UBUNTU_22_04,
                },
                dataSource: {
                    http: {
                        url: formValues.imageSource,
                        headers: {}
                    },
                },
                boundPvc: {
                    storageClassName: 'local-path',
                    capacity: '10Gi'
                }
            }
        }
        try {
            await DataVolumeManagement.CreateDataVolumeWithNotification(request, this.notification)
            navigate('/virtual/images')
        } finally {
            setLoading(false)
        }
    }
}

const Create: React.FC = () => {
    const { notificationContext, showDataVolumeNotification } = useDataVolumeNotification()

    const handler = new ImageCreateHandler(showDataVolumeNotification)

    const navigate = useNavigate()

    const [namespace, setNamespace] = useState<string>(defaultNamespace)
    const [submittable, setSubmittable] = React.useState<boolean>(false)

    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()
    const values = Form.useWatch([], form)
    React.useEffect(() => {
        handler.validateFields(form, setSubmittable)
    }, [form, values])

    return (
        <>
            <div>{notificationContext}</div>
            <Form
                className={commonFormStyles.form}
                form={form}
                onFinish={(values: any) => handler.submit(values, setLoading, navigate)}
                name="datavolume"
                initialValues={{ namespace: namespace, imageVolumeCapacity: 10 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="middle"
                    direction="vertical"
                >
                    <BasicInformation onSelectCallback={(value: string) => handler.selectNamespace(setNamespace, value)} />

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
