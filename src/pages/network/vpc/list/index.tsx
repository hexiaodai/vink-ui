import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Modal, Select, Space } from 'antd'
import { useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { classNames, generateMessage } from '@/utils/utils'
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import type { ActionType } from '@ant-design/pro-components'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import columnsFunc from '@/pages/network/vpc/list/table-columns.tsx'

export default () => {
    const { notification } = App.useApp()

    const [selectedRows, setSelectedRows] = useState<any[]>([])

    const actionRef = useRef<ActionType>()

    const [vpcs, setVpcs] = useState<any[]>([])

    const columns = columnsFunc(actionRef, notification)

    return (
        <ProTable<any, Params>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
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
                                title: "批量删除 VPC？",
                                content: generateMessage(selectedRows, `即将删除 "{names}" VPC，请确认`, `即将删除 "{names}" 等 {count} 个 VPC，请确认。`),
                                okText: '确认删除',
                                okType: 'danger',
                                cancelText: '取消',
                                okButtonProps: {
                                    disabled: false,
                                },
                                onOk: async () => {
                                    await clients.batchDeleteResources(GroupVersionResourceEnum.VPC, selectedRows, { notification: notification }).then(() => {
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
            loading={{ indicator: <LoadingOutlined /> }}
            dataSource={vpcs}
            request={async (params) => {
                try {
                    const vpcs = await clients.fetchResources(GroupVersionResourceEnum.VPC, {
                        fieldSelector: (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : undefined,
                    })
                    setVpcs(vpcs)
                } catch (err: any) {
                    notification.error({ message: err })
                }
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'vpc-list-table-columns',
                persistenceType: 'localStorage',
            }}
            rowKey={(vm) => namespaceName(vm.metadata)}
            search={false}
            options={{
                fullScreen: true,
                search: {
                    allowClear: true,
                    style: { width: 280 },
                    addonBefore: <Select defaultValue="metadata.name" options={[
                        { value: 'metadata.name', label: '名称' },
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/network/vpcs/create'><Button icon={<PlusOutlined />}>创建 VPC</Button></NavLink>
                ]
            }}
        />
    )
}
