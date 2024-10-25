import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Modal, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { calcScroll, classNames, dataSource, generateMessage } from '@/utils/utils'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { clients } from '@/clients/clients'
import { ListWatchOptions, useWatchResources } from '@/hooks/use-resource'
import type { ActionType } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import columnsFunc from '@/pages/network/subnet/list/table-columns.tsx'

export default () => {
    const { notification } = App.useApp()

    const [scroll, setScroll] = useState(150 * 11)

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const columns = columnsFunc(actionRef, notification)

    const [opts, setOpts] = useState<ListWatchOptions>()

    const { resources: subnets, loading } = useWatchResources(GroupVersionResourceEnum.SUBNET, opts)

    return (
        <ProTable<any, Params>
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
                                title: "批量删除子网？",
                                content: generateMessage(selectedRows, `即将删除 "{names}" 子网，请确认`, `即将删除 "{names}" 等 {count} 个子网，请确认。`),
                                okText: '确认删除',
                                okType: 'danger',
                                cancelText: '取消',
                                okButtonProps: {
                                    disabled: false,
                                },
                                onOk: async () => {
                                    await clients.batchDeleteResources(GroupVersionResourceEnum.SUBNET, selectedRows, { notification: notification }).then(() => {
                                        actionRef.current?.reload()
                                    })
                                }
                            })
                        }}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ spinning: loading, indicator: <LoadingOutlined /> }}
            dataSource={dataSource(subnets)}
            request={async (params) => {
                setOpts({
                    fieldSelector: (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : undefined
                })
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'subnet-list-table-columns',
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
                    <NavLink to='/network/subnets/create'><Button icon={<PlusOutlined />}>创建子网</Button></NavLink>
                ]
            }}
        />
    )
}
