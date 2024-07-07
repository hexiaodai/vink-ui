import React, { useState } from 'react'
import { Button, Form, Space, Row, Col, FormInstance } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import { CreateDataVolumeRequest, DataVolumeType } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useDataVolumeNotification } from '@/components/notification'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { DataVolumeManagement } from '@/apis-management/datavolume'
import commonFormStyles from '@/common/styles/form.module.less'
import BasicInformation from '@/pages/virtual/disk/create/basic-information'

class DiskCreateHandler {
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
                dataVolumeType: DataVolumeType.DATA,
                dataSource: {
                    blank: {}
                },
                boundPvc: {
                    storageClassName: 'local-path',
                    capacity: '10Gi'
                }
            }
        }
        try {
            await DataVolumeManagement.CreateDataVolumeWithNotification(request, this.notification)
            navigate('/virtual/disks')
        } finally {
            setLoading(false)
        }
    }
}

const Create: React.FC = () => {
    const { notificationContext, showDataVolumeNotification } = useDataVolumeNotification()

    const handler = new DiskCreateHandler(showDataVolumeNotification)

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
                initialValues={{ namespace: namespace, dataVolumeCapacity: 40 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="middle"
                    direction="vertical"
                >
                    <BasicInformation onSelectCallback={(value: string) => handler.selectNamespace(setNamespace, value)} />

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
