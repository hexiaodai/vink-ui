import { FooterToolbar, ProCard, ProForm, ProFormItem, ProFormSelect, ProFormText, ProFormTextArea } from '@ant-design/pro-components'
import { App, Button, Flex, Slider, Space, Table, TableProps } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultNamespace, formatMemory, namespaceName } from '@/utils/k8s'
import { ListNamespacesRequest, Namespace, NamespaceManagement } from '@kubevm.io/vink/management/namespace/v1alpha1/namespace.pb'
import { NotificationInstance } from 'antd/es/notification/interface'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import type { ProFormInstance } from '@ant-design/pro-components'
import AddRootDisk from './add-root-disk'
import AddDataDisk from './add-data-disk'
import Styles from '@/pages/virtual/machine/create/styles/index.module.less'
import TableColumnOperatingSystem from '@/components/table-column'

const defaultCloudInit = `
#cloud-config
ssh_pwauth: true
disable_root: false
chpasswd: {"list": "root:dangerous", expire: False}

runcmd:
- dhclient -r && dhclient
- sed -i "/#\?PermitRootLogin/s/^.*$/PermitRootLogin yes/g" /etc/ssh/sshd_config
- systemctl restart sshd.service
`

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
        render: (_, dv) => (<>{formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)}</>)
    },
    {
        title: '操作',
        key: 'action',
        width: 100,
        align: 'center',
        render: (_, dv) => <a>删除</a>
    }
]

class Handler {
    private notification: NotificationInstance

    constructor(notification: NotificationInstance) {
        this.notification = notification
    }

    useNamespaces = () => {
        const [data, setData] = useState<Namespace[]>([])

        const fetchData = useCallback(async () => {
            try {
                const request: ListNamespacesRequest = {}
                const response = await NamespaceManagement.ListNamespaces(request)
                setData(response.items || [])
            } catch (err: any) {
                this.notification.error({ message: "Namespaces", description: err?.message })
            }
        }, [])

        useEffect(() => {
            fetchData()
        }, [fetchData])

        return { data, fetchData }
    }
}

export default () => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const [openRootDisk, setRootDiskOpen] = useState(false)
    const [openDataDisk, setOpenDataDisk] = useState(false)
    const [image, setImage] = useState<DataVolume>({})
    const [rootDiskCapacity, setRootDiskCapacity] = useState(128)
    const [dataDisks, setDataDisks] = useState<DataVolume[]>([])

    const handler = new Handler(notification)
    const { data } = handler.useNamespaces()

    useEffect(() => {
        formRef.current?.setFieldsValue({
            image: image
        })
    }, [image])

    useEffect(() => {
        formRef.current?.setFieldsValue({
            dataDisks: dataDisks
        })
    }, [dataDisks])

    useEffect(() => {
        formRef.current?.setFieldsValue({
            rootDiskCapacity: rootDiskCapacity
        })
    }, [rootDiskCapacity])

    return (
        <ProForm
            className={Styles["form"]}
            labelCol={{ span: 4 }}
            layout="horizontal"
            labelAlign="left"
            colon={false}
            formRef={formRef}
            onReset={() => {
                setImage({})
                setDataDisks([])
                setRootDiskCapacity(128)
            }}
            submitter={{
                render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
            }}
        >
            <Space
                direction="vertical"
                size="middle"
                className={Styles["container"]}
            >
                <ProCard title="基本信息" headerBordered>
                    <ProFormSelect
                        width="md"
                        label="命名空间"
                        name="namespace"
                        placeholder="选择命名空间"
                        initialValue={defaultNamespace}
                        fieldProps={{ allowClear: false, showSearch: true }}
                        options={data.map((ns: Namespace) => ({ value: ns.name, label: ns.name }))}
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$/,
                            message: "The name can only contain lowercase letters, numbers, and hyphens (-), and must start and end with a letter, with a maximum length of 64 characters."
                        }]}
                    />
                    <ProFormText
                        width="md"
                        name="name"
                        label="名称"
                        placeholder="输入虚拟机名称"
                        rules={[{
                            required: true,
                            pattern: /^[a-z]([-a-z0-9]{0,14}[a-z0-9])?$/,
                            message: "The name can only contain lowercase letters, numbers, and hyphens (-), and must start and end with a letter, with a maximum length of 16 characters."
                        }]}
                    />
                    <ProFormItem
                        name="image"
                        label="系统镜像"
                        rules={[{
                            required: true,
                            validator(_, value: DataVolume) {
                                if (value.dataVolume?.status?.phase === "Succeeded") {
                                    return Promise.resolve()
                                }
                                return Promise.reject(new Error("The system image is not ready"))
                            },
                            message: "The system image is not ready."
                        }]}
                    >
                        <Space size="large">
                            {
                                image?.name ? (
                                    <Flex align='center'>
                                        <TableColumnOperatingSystem dv={image} />
                                        <span style={{ marginLeft: 12 }}>{image.name}</span>
                                    </Flex>
                                ) : (<></>)
                            }
                            <Button type="dashed" onClick={() => setRootDiskOpen(true)}>选择系统镜像</Button>
                        </Space>
                    </ProFormItem>
                </ProCard>

                <ProCard title="计算资源" headerBordered>
                    <ProFormSelect
                        width="md"
                        label="处理器"
                        name="cpu"
                        placeholder="选择处理器核心数"
                        initialValue={2}
                        options={
                            Array.from({ length: 32 }, (_, i) => ({
                                label: `${i + 1} 核`,
                                value: i + 1
                            }))
                        }
                        fieldProps={{ allowClear: false, showSearch: true }}
                        rules={[{
                            required: true,
                            pattern: /^[1-9]\d*$/,
                            message: "请选择处理器核心数"
                        }]}
                    />
                    <ProFormSelect
                        width="md"
                        label="内存"
                        name="memory"
                        placeholder="选择内存大小"
                        initialValue={4}
                        options={
                            Array.from({ length: 32 }, (_, i) => ({
                                label: `${i + 1} Gi`,
                                value: i + 1
                            }))
                        }
                        fieldProps={{ allowClear: false, showSearch: true }}
                        rules={[{
                            required: true,
                            pattern: /^[1-9]\d*$/,
                            message: "请选择内存大小"
                        }]}
                    />
                </ProCard>

                <ProCard title="存储" headerBordered>
                    <ProFormItem
                        label="系统盘"
                        name="rootDiskCapacity"
                        rules={[{
                            required: true,
                            message: "系统盘的磁盘空间容量需大于所选系统镜像的大小"
                        }]}
                    >
                        <Slider
                            tooltip={{ overlayStyle: { zIndex: 0 }, autoAdjustOverflow: false, open: true, placement: "top", formatter: (v) => `${v} Gi` }}
                            min={10}
                            max={2048}
                            onChange={setRootDiskCapacity}
                            marks={{
                                128: '128 Gi',
                                512: '512 Gi',
                                1024: '1024 Gi',
                                1536: '1536 Gi',
                                2048: {
                                    style: { color: '#f50' },
                                    label: <strong>2048 Gi</strong>
                                }
                            }}
                            value={rootDiskCapacity}
                        />
                    </ProFormItem>

                    <ProFormItem
                        name="dataDisks"
                        label="数据盘"
                    >
                        {
                            dataDisks.length > 0 && (
                                <Table
                                    size="small"
                                    style={{ width: 492, marginBottom: 24 }}
                                    columns={columns} dataSource={dataDisks} pagination={false}
                                    rowKey={(dv) => namespaceName(dv)}
                                />
                            )
                        }
                        <Button type="dashed" onClick={() => setOpenDataDisk(true)}>添加数据盘</Button>
                    </ProFormItem>
                </ProCard>

                <ProCard title="网络" headerBordered></ProCard>

                <ProCard title="系统设置" headerBordered>
                    <ProFormTextArea
                        fieldProps={{ rows: 9 }}
                        placeholder="输入 cloud-init 脚本"
                        initialValue={defaultCloudInit.trim()}
                        name="cloudInit"
                        label="cloud-init"
                    />
                </ProCard>
            </Space>

            <AddRootDisk
                open={openRootDisk}
                current={image}
                namespace={defaultNamespace}
                onCanel={() => setRootDiskOpen(false)}
                onConfirm={(dv: DataVolume | undefined) => {
                    setImage(dv || {})
                    setRootDiskOpen(false)
                }}
            />
            <AddDataDisk
                open={openDataDisk}
                current={dataDisks}
                onCanelCallback={() => setOpenDataDisk(false)}
                onConfirmCallback={(disks: DataVolume[]) => {
                    setDataDisks(disks)
                    setOpenDataDisk(false)
                }}
                namespace={defaultNamespace}
            />
        </ProForm >
    )
}
