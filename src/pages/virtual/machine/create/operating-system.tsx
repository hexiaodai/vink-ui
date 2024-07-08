import React, { useEffect, useState } from 'react'
import { Button, Space, Card, Alert, Input, Form, FormInstance, Descriptions, DescriptionsProps, Flex } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { IconFont } from '@/components/icon'
import { formatMemory } from '@/utils/k8s'
import AddRootDisk from '@/pages/virtual/machine/create/add-root-disk'
import styles from '@/pages/virtual/machine/create/styles/operating-system.module.less'

interface OperatingSystemProps {
    namespace: string
    form: FormInstance<any>
}

class OperatingSystemHandler {
    private props: OperatingSystemProps

    constructor(props: OperatingSystemProps) {
        this.props = props
    }

    openDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
        setOpen(true)
    }

    cancelDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
        setOpen(false)
    }

    confirmDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>, setDataVolume: React.Dispatch<React.SetStateAction<DataVolume>>, disk?: DataVolume) => {
        if (disk) {
            setDataVolume(disk)
        }
        setOpen(false)
    }

    validateRootDisk = (disk: DataVolume) => {
        if (disk && ((disk.name?.length || 0) > 0) && ((disk.namespace?.length || 0) > 0)) {
            return Promise.resolve()
        }
        return Promise.reject(new Error('请选择系统镜像'))
    }

    capacity = (dv: DataVolume) => {
        const [value, unit] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
        return `${value} ${unit}`
    }

    setOperatingSystem = (dv: DataVolume) => {
        this.props.form.setFieldsValue({
            operatingSystem: dv
        })
    }
}

const OperatingSystem: React.FC<OperatingSystemProps> = ({ namespace, form }) => {
    const handler = new OperatingSystemHandler({ namespace, form })

    const [open, setOpen] = useState(false)
    const [dataVolume, setDataVolume] = useState<DataVolume>({})

    useEffect(() => {
        handler.setOperatingSystem(dataVolume)
    }, [dataVolume])

    const items: DescriptionsProps['items'] = [
        {
            key: 'operatingSystem',
            label: '操作系统',
            children: (
                <Flex justify='start' align='center'>
                    <IconFont type={"icon-ubuntu"} className={styles['operating-system-descriptions-icon']} />
                    <span>Ubuntu 20.04</span>
                </Flex>
            )
        },
        {
            key: 'name',
            label: '名称',
            children: dataVolume.name,
        },
        {
            key: 'capacity',
            label: '容量',
            children: handler.capacity(dataVolume),
        },
    ]

    return (
        <Card
            bordered={false}
            title={
                <Space>
                    <span>系统镜像</span>
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => handler.openDrawer(setOpen)}
                    >添加系统镜像</Button>
                </Space>
            }
        >

            <Form.Item
                name="operatingSystem"
                label="系统镜像"
                hidden
                rules={[{ required: true, message: '', validator: (_: any, value: any) => handler.validateRootDisk(value) }]}
            >
                <Input />
            </Form.Item>

            {
                dataVolume?.name ? (
                    <Descriptions
                        style={{ width: 554 }}
                        bordered
                        size='small'
                        className={styles['operating-system-descriptions']}
                        column={3}
                        items={items}
                    />

                ) : (
                    // <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    <Alert className={styles['operating-system-alert']} showIcon message="请添加操作系统镜像" type="error" />
                )
            }

            {
                open && (<AddRootDisk
                    open={open}
                    namespace={namespace}
                    current={dataVolume}
                    onCanel={() => handler.cancelDrawer(setOpen)}
                    onConfirm={(dv: DataVolume | undefined) => handler.confirmDrawer(setOpen, setDataVolume, dv)}
                />)
            }
        </Card>
    )
}

export default OperatingSystem
