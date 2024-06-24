import { useEffect, useState } from 'react'
import { Form, InputNumber, Input, Space, Card, Button, FormInstance, Table, TableProps, Tooltip } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import AddDataDisk from '@/pages/virtualmachine/create/add-data-disk'
import type { DataVolume } from '@/apis/management/datavolume/v1alpha1/datavolume.pb'
import { formatMemory, namespaceNamed } from '@/utils/k8s'

interface StorageProps {
    namespace: string
    form: FormInstance<any>
}

const Storage: React.FC<StorageProps> = ({ namespace, form }) => {
    const [open, setOpen] = useState(false)
    const [dataDisks, setDataDisks] = useState<DataVolume[]>([])

    useEffect(() => {
        form.setFieldsValue({
            datadisks: dataDisks
        })
    }, [dataDisks])


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
        // {
        //     title: '描述',
        //     key: 'description',
        //     ellipsis: {
        //         showTitle: false,
        //     },
        // },
        {
            title: '操作',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, dv) => (
                <a onClick={() => {
                    const newDataDisks = dataDisks.filter(item => !(namespaceNamed(item) === namespaceNamed(dv)))
                    setDataDisks(newDataDisks)
                }}>
                    删除
                </a>
            )
        }
    ]

    const handleCanel = () => {
        setOpen(false)
    }

    const handleConfirm = (disks: DataVolume[]) => {
        setOpen(false)
        setDataDisks(disks)
    }

    const handleAddDataDisk = () => {
        setOpen(true)
    }

    return (
        <Card title={
            <Space>
                <span>存储</span>
                {/* <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => console.log('click')}
                >创建数据盘</Button> */}
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={handleAddDataDisk}
                >添加数据盘</Button>
            </Space>}
            bordered={false}
        >
            <Form.Item
                name="rootdisk"
                label="系统盘"
                rules={[{ required: true, message: '' }]}
                tooltip="建议大于系统镜像的容量。"
            >

                <InputNumber min={10} style={{ width: 265 }} addonAfter="Gi" />
            </Form.Item>

            {
                dataDisks.length > 0 && (
                    <Form.Item
                        name="datadisks"
                        label="数据盘"
                        style={{ marginBottom: 0 }}
                        tooltip="数据盘至少需要 1 Gi。"
                    >
                        <Table
                            size="small"
                            style={{ width: 554 }}
                            columns={columns} dataSource={dataDisks} pagination={false}
                            rowKey={(record) => namespaceNamed(record)}
                        />
                    </Form.Item>
                )
            }

            {
                open && (
                    <AddDataDisk
                        open={open}
                        namespace={namespace}
                        current={dataDisks}
                        onCanelCallback={handleCanel}
                        onConfirmCallback={handleConfirm}
                    />
                )
            }
        </Card>
    )
}

export default Storage
