import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Modal, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { calcScroll, classNames, dataSource, generateMessage } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import type { ActionType } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import columnsFunc from '@/pages/storage/disk/list/table-columns.tsx'

export default () => {
    const ctrl = useRef<AbortController>()

    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const [scroll, setScroll] = useState(150 * 9)
    const [selectedRows, setSelectedRows] = useState<CustomResourceDefinition[]>([])

    const actionRef = useRef<ActionType>()

    const [disk, setDisk] = useState<Map<string, CustomResourceDefinition>>(new Map<string, CustomResourceDefinition>())

    const watchDataDisks = clients.createWatchResource(GroupVersionResourceEnum.DATA_VOLUME, setDisk)

    const columns = columnsFunc(notification)

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    useEffect(() => {
        return () => {
            console.log('Component is unmounting and aborting operation')
            ctrl.current?.abort()
        }
    }, [])

    return (
        <ProTable<CustomResourceDefinition, Params>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
            scroll={{ x: scroll }}
            rowSelection={{
                defaultSelectedRowKeys: [],
                onChange: (_, selectedRows) => {
                    setSelectedRows(selectedRows)
                }
            }}
            tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
                return (
                    <Space size={16}>
                        <span>已选 {selectedRowKeys.length} 项</span>
                        <a onClick={onCleanSelected}>取消选择</a>
                    </Space>
                )
            }}
            tableAlertOptionRender={() => {
                return (
                    <Space size={16}>
                        <a className={commonStyles["warning-color"]} onClick={async () => {
                            Modal.confirm({
                                title: "批量删除系统镜像？",
                                content: generateMessage(selectedRows, `即将删除 "{names}" 磁盘，请确认`, `即将删除 "{names}" 等 {count} 个磁盘，请确认。`),
                                okText: '确认删除',
                                okType: 'danger',
                                cancelText: '取消',
                                okButtonProps: {
                                    disabled: false,
                                },
                                onOk: async () => {
                                    await clients.batchDeleteResources(GroupVersionResourceEnum.DATA_VOLUME, selectedRows, { notification: notification })
                                }
                            })
                        }}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ indicator: <LoadingOutlined /> }}
            dataSource={dataSource(disk)}
            request={async (params) => {
                ctrl.current?.abort()
                ctrl.current = new AbortController()

                await watchDataDisks({
                    namespace: namespace,
                    labelSelector: `${labels.VinkDatavolumeType.name}!=image`,
                    fieldSelector: (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : undefined,
                    notification: notification,
                    abortCtrl: ctrl.current
                })
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'virtual-disk-list-table-columns',
                persistenceType: 'localStorage',
                onChange: (obj) => setScroll(calcScroll(obj))
            }}
            rowKey={(vm) => namespaceName(vm.metadata)}
            search={false}
            options={{
                fullScreen: true,
                search: {
                    allowClear: true,
                    style: { width: 280 },
                    addonBefore: <Select defaultValue="metadata.name" options={[
                        { value: 'metadata.name', label: '名称' }
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/storage/disks/create'><Button icon={<PlusOutlined />}>添加磁盘</Button></NavLink>
                ]
            }}
        />
    )
}
