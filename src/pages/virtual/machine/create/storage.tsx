import { useEffect, useState } from 'react'
import { Form, InputNumber, Space, Card, Button, FormInstance, Table, TableProps, Tooltip } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { formatMemory, namespaceName } from '@/utils/k8s'
import type { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import AddDataDisk from '@/pages/virtual/machine/create/add-data-disk'
import commonFormStyles from '@/common/styles/form.module.less'

interface StorageProps {
    namespace: string
    form: FormInstance<any>
}

export const rootVolumeCapacityUnit = 'Gi'

class StorageHandler {
    private props: StorageProps

    constructor(props: StorageProps) {
        this.props = props
    }

    openDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
        setOpen(true)
    }

    cancelDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => {
        setOpen(false)
    }

    confirmDrawer = (setOpen: React.Dispatch<React.SetStateAction<boolean>>, setDataVolumes: React.Dispatch<React.SetStateAction<DataVolume[]>>, disks: DataVolume[]) => {
        setDataVolumes(disks)
        setOpen(false)
    }

    capacity = (dv: DataVolume) => {
        const [value, unit] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
        return `${value} ${unit}`
    }

    delete = (dv: DataVolume, dvs: DataVolume[], setDataVolumes: React.Dispatch<React.SetStateAction<DataVolume[]>>) => {
        const newDataVolumes = dvs.filter(item => !(namespaceName(item) === namespaceName(dv)))
        setDataVolumes(newDataVolumes)
    }

    setDataVolumes = (dvs: DataVolume[]) => {
        this.props.form.setFieldsValue({
            dataVolumes: dvs
        })
    }
}

const Storage: React.FC<StorageProps> = ({ namespace, form }) => {
    const handler = new StorageHandler({ namespace, form })

    const [open, setOpen] = useState(false)
    const [dataVolumes, setDataVolumes] = useState<DataVolume[]>([])

    useEffect(() => {
        handler.setDataVolumes(dataVolumes)
    }, [dataVolumes])

    const columns: TableProps<DataVolume>['columns'] = [
        {
            title: '名称',
            key: 'name',
            ellipsis: true,
            render: (_, dv) => (<>{dv.name}</>)
        },
        {
            title: '容量',
            key: 'capacity',
            ellipsis: true,
            render: (_, dv) => handler.capacity(dv)
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (<a onClick={() => handler.delete(dv, dataVolumes, setDataVolumes)}>删除</a>)
        }
    ]

    return (
        <Card title={
            <Space>
                <span>存储</span>
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => handler.openDrawer(setOpen)}
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
                    <InputNumber min={10} addonAfter={rootVolumeCapacityUnit} />
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
                        onCanelCallback={() => handler.cancelDrawer(setOpen)}
                        onConfirmCallback={(disks: DataVolume[]) => handler.confirmDrawer(setOpen, setDataVolumes, disks)}
                    />
                )
            }
        </Card>
    )
}

export default Storage
