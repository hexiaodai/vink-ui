import React, { useEffect, useState } from 'react'
import { Button, Space, Card, Alert, Input, Form, FormInstance, Descriptions, DescriptionsProps, Flex, Table, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { IconFont } from '@/common/icon'
import AddRootDisk from '@/pages/virtualmachine/create/add-root-disk'
import { formatMemory, namespaceNamed } from '@/utils/k8s'
import styles from '@/pages/virtualmachine/create/styles/operating-system.module.less'

interface NamespaceProps {
    namespace: string
    form: FormInstance<any>
}

const OperatingSystem: React.FC<NamespaceProps> = ({ namespace, form }) => {
    const [open, setOpen] = useState(false)
    const [dataVolume, setDataVolume] = useState<DataVolume>({})

    useEffect(() => {
        form.setFieldsValue({
            operatingSystem: dataVolume
        })
    }, [dataVolume])

    if (dataVolume.namespace && namespace !== dataVolume.namespace) {
        setDataVolume({})
    }

    const handleCanel = () => {
        setOpen(false)
    }

    const handleConfirm = (disk?: DataVolume) => {
        if (disk) {
            setDataVolume(disk)
        }
        setOpen(false)
    }

    const validateRootDisk = (_: any, value: string) => {
        if (value) {
            return Promise.resolve()
        }
        return Promise.reject(new Error('请选择系统镜像'))
    }

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
            children: (() => {
                const [value, unit] = formatMemory(dataVolume.dataVolume?.spec?.pvc?.resources?.requests?.storage)
                return `${value} ${unit}`
            })(),
        },
        // {
        //     key: 'description',
        //     label: '描述',
        //     children: 'this is a test',
        // },
    ]

    return (
        <Card
            bordered={false}
            title={
                <Space>
                    <span>系统镜像</span>
                    {/* <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => console.log('click')}
                    >创建系统镜像</Button> */}
                    <Button
                        type="text"
                        icon={<PlusOutlined />}
                        onClick={() => setOpen(true)}
                    >添加系统镜像</Button>
                </Space>
            }
        >

            <Form.Item
                name="operatingSystem"
                label="系统镜像"
                hidden
                rules={[{ required: true, message: '', validator: validateRootDisk }]}
            >
                <Input />
            </Form.Item>

            {
                dataVolume.name ? (
                    <Descriptions
                        style={{ width: 554 }}
                        bordered
                        size='small'
                        className={styles['operating-system-descriptions']}
                        column={3}
                        items={items}
                    />

                ) : (
                    <Alert className={styles['operating-system-alert']} showIcon message="请添加操作系统镜像" type="error" />
                )
            }

            {
                open && (<AddRootDisk
                    open={open}
                    namespace={namespace}
                    current={dataVolume}
                    onCanel={handleCanel}
                    onConfirm={handleConfirm}
                />)
            }
        </Card>
    )
}

export default OperatingSystem
