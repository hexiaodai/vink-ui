import React, { useState } from 'react'
import { Button, Form, Space, Row, Col, FormInstance } from 'antd'
import { defaultNamespace } from '@/utils/k8s'
import { useVirtualMachineNotification } from '@/components/notification'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import { VirtualMachineManagement } from '@/apis-management/virtualmachine'
import { rootVolumeCapacityUnit } from '@/pages/virtual/machine/create/storage'
import { memoryUnit } from '@/pages/virtual/machine/create/cpu-mem'
import type { CreateVirtualMachineRequest, VirtualMachineConfigStorageDataVolume } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import BasicInformation from '@/pages/virtual/machine/create/basic-information'
import OperatingSystem from '@/pages/virtual/machine/create/operating-system'
import CPUMemory from '@/pages/virtual/machine/create/cpu-mem'
import Storage from '@/pages/virtual/machine/create/storage'
import SystemConfiguration from '@/pages/virtual/machine/create/system-configuration'
import commonFormStyles from '@/common/styles/form.module.less'

class VirtalMachineCreateHandler {
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

        const dataVolumes: VirtualMachineConfigStorageDataVolume[] = []
        formValues.dataVolumes?.forEach((item: any) => {
            dataVolumes.push({ ref: { name: item.name, namespace: item.namespace } })
        })

        const request: CreateVirtualMachineRequest = {
            namespace: formValues.namespace,
            name: formValues.name,
            config: {
                storage: {
                    root: {
                        ref: {
                            namespace: formValues.operatingSystem.namespace,
                            name: formValues.operatingSystem.name
                        },
                        capacity: formValues.rootVolumeCapacity + rootVolumeCapacityUnit,
                        // FIXME: remove it
                        storageClassName: "local-path"
                    },
                    data: dataVolumes
                },
                compute: {
                    cpuCores: formValues.cpu,
                    memory: formValues.memory + memoryUnit
                },
                userConfig: {
                    cloudInitBase64: btoa(formValues.cloudInit)
                }
            }
        }
        try {
            await VirtualMachineManagement.CreateVirtualMachineWithNotification(request, this.notification)
            navigate('/virtual/machines')
        } finally {
            setLoading(false)
        }
    }
}

const Create: React.FC = () => {
    const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()
    const navigate = useNavigate()

    const handler = new VirtalMachineCreateHandler(showVirtualMachineNotification)

    const [namespace, setNamespace] = useState<string>(defaultNamespace)
    const [submittable, setSubmittable] = React.useState<boolean>(false)
    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()
    const values = Form.useWatch([], form)
    React.useEffect(() => {
        handler.validateFields(form, setSubmittable)
    }, [form, values])

    return (
        <div>
            {notificationContext}
            <Form
                className={commonFormStyles.form}
                form={form}
                onFinish={(values: any) => handler.submit(values, setLoading, navigate)}
                name="create-virtual-machine"
                initialValues={{ namespace: namespace, cpu: 2, memory: 4, rootVolumeCapacity: 40 }}
                layout='vertical'
            >
                <Space
                    className={commonFormStyles.space}
                    size="middle" direction="vertical"
                >
                    <BasicInformation onSelectCallback={(value: string) => handler.selectNamespace(setNamespace, value)} />

                    <OperatingSystem form={form} namespace={namespace} />

                    <CPUMemory />

                    <Storage form={form} namespace={namespace} />

                    <SystemConfiguration form={form} />

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
