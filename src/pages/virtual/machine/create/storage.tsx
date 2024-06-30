import { useEffect, useState } from 'react'
import { Form, InputNumber, Space, Card, Button, FormInstance, Table, TableProps, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AddDataDisk from '@/pages/virtual/machine/create/add-data-disk'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { formatMemory, namespaceName } from '@/utils/k8s'
import commonFormStyles from '@/common/styles/form.module.less'

interface StorageProps {
    namespace: string
    form: FormInstance<any>
}

const Storage: React.FC<StorageProps> = ({ namespace, form }) => {
    const [open, setOpen] = useState(false)
    const [dataVolumes, setDataVolumes] = useState<DataVolume[]>([])

    useEffect(() => {
        form.setFieldsValue({
            dataVolumes: dataVolumes
        })
    }, [dataVolumes])


    const columns: TableProps<DataVolume>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => (<Tooltip title={dv.name}>{dv.name}</Tooltip>)
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: {
                showTitle: false,
            },
            render: (_, dv) => {
                const [value, uint] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
                const capacity = `${value} ${uint}`
                return (<Tooltip title={capacity}>{capacity}</Tooltip>)
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (
                <a onClick={() => {
                    const newDataVolumes = dataVolumes.filter(item => !(namespaceName(item) === namespaceName(dv)))
                    setDataVolumes(newDataVolumes)
                }}>
                    删除
                </a>
            )
        }
    ]

    const handleCanel = () => {
        setOpen(false)
    }

    const handleConfirm = (dvs: DataVolume[]) => {
        setOpen(false)
        setDataVolumes(dvs)
    }

    const handleAddDataDisk = () => {
        setOpen(true)
    }

    return (
        <Card title={
            <Space>
                <span>存储</span>
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddDataDisk}
                >添加数据盘</Button>
            </Space>}
            bordered={false}
        >
            <Space direction="vertical" size="large">
                <Form.Item
                    name="rootVolumeCapacity"
                    label="系统盘"
                    rules={[{ required: true, message: '' }]}
                    tooltip="建议大于系统镜像的容量。"
                >
                    <InputNumber min={10} addonAfter="Gi" />
                </Form.Item>
                {
                    dataVolumes.length > 0 && (
                        <Form.Item
                            name="dataVolumes"
                            label="数据盘"
                            className={commonFormStyles['form-item-default-width']}
                        >
                            <Table
                                size="small"
                                style={{ width: 554 }}
                                columns={columns} dataSource={dataVolumes} pagination={false}
                                rowKey={(dv) => namespaceName(dv)}
                            />
                        </Form.Item>
                    )
                }
            </Space>

            {
                open && (
                    <AddDataDisk
                        open={open}
                        namespace={namespace}
                        current={dataVolumes}
                        onCanelCallback={handleCanel}
                        onConfirmCallback={handleConfirm}
                    />
                )
            }
        </Card>
    )
}

export default Storage
