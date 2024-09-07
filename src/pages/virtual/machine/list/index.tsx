import { PlusOutlined, LoadingOutlined } from '@ant-design/icons'
import { ProTable } from '@ant-design/pro-components'
import { App, Button, Select, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceName } from '@/utils/k8s'
import { NavLink, Params } from 'react-router-dom'
import { VirtualMachinePowerStateRequest_PowerState } from '@/apis/management/virtualmachine/v1alpha1/virtualmachine'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { batchDeleteVirtualMachines, batchManageVirtualMachinePowerState, ResourceUpdater } from '@/pages/virtual/machine/list/resource-manager'
import type { ActionType, ColumnsState } from '@ant-design/pro-components'
import TableStyles from '@/common/styles/table.module.less'
import columnsFunc from '@/pages/virtual/machine/list/table-columns.tsx'

const calcScroll = (obj: Record<string, ColumnsState>) => {
    let count = 0
    Object.keys(obj).forEach((key) => {
        if (obj[key].show) {
            count++
        }
    })
    return count * 150
}

export default () => {
    const ctrl = useRef<AbortController>()

    const { notification } = App.useApp()

    const [searchFilter, setSearchFilter] = useState<string>("name")
    const [scroll, setScroll] = useState(0)
    const [selectedRows, setSelectedRows] = useState<CustomResourceDefinition[]>([])

    const actionRef = useRef<ActionType>()

    const [virtualMachine, setVirtualMachine] = useState<Map<string, CustomResourceDefinition>>(new Map<string, CustomResourceDefinition>())
    const [virtualMachineInstance, setVirtualMachineInstance] = useState<Map<string, CustomResourceDefinition>>(new Map<string, CustomResourceDefinition>())
    const [rootDisk, setRootDisk] = useState<Map<string, CustomResourceDefinition>>(new Map<string, CustomResourceDefinition>())
    const [node, setNode] = useState<Map<string, CustomResourceDefinition>>(new Map<string, CustomResourceDefinition>())

    const resource = useRef<ResourceUpdater>()

    const columns = columnsFunc(virtualMachineInstance, rootDisk, node, notification)

    const dataSource = (): CustomResourceDefinition[] | undefined => {
        let items = Array.from(virtualMachine.values())
        if (items.length > 0) {
            return items
        }
        return undefined
    }

    useEffect(() => {
        if (resource.current) return
        resource.current = new ResourceUpdater(virtualMachine, setVirtualMachine, virtualMachineInstance, setVirtualMachineInstance, rootDisk, setRootDisk, node, setNode, notification)
    }, [])

    useEffect(() => {
        return () => {
            console.log('Component is unmounting and aborting operation')
            ctrl.current?.abort()
        }
    }, [])

    return (
        <ProTable<CustomResourceDefinition, Params>
            className={TableStyles["table-container"]}
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
                        <a onClick={async () => await batchManageVirtualMachinePowerState(selectedRows, VirtualMachinePowerStateRequest_PowerState.ON, notification)}>批量开机</a>
                        <a onClick={async () => await batchManageVirtualMachinePowerState(selectedRows, VirtualMachinePowerStateRequest_PowerState.REBOOT, notification)}>批量重启</a>
                        <a onClick={async () => await batchManageVirtualMachinePowerState(selectedRows, VirtualMachinePowerStateRequest_PowerState.OFF, notification)}>批量关机</a>
                        <a className={TableStyles["warning"]} onClick={() => batchDeleteVirtualMachines(selectedRows)}>批量删除</a>
                    </Space>
                )
            }}
            columns={columns}
            actionRef={actionRef}
            loading={{ indicator: <LoadingOutlined /> }}
            dataSource={dataSource()}
            request={async (params) => {
                ctrl.current?.abort()
                ctrl.current = new AbortController()

                const advancedParams = { searchFilter: searchFilter, params: params }
                await resource.current?.updateResource(advancedParams, ctrl.current)
                return { success: true }
            }}
            columnsState={{
                persistenceKey: 'virtual-machine-list-table-columns',
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
                    addonBefore: <Select defaultValue="name" onChange={(value) => setSearchFilter(value)} options={[
                        { value: 'name', label: '名称' },
                        { value: 'namespace', label: '命名空间' }
                    ]} />
                }
            }}
            pagination={false}
            toolbar={{
                actions: [
                    <NavLink to='/virtual/machines/create'><Button icon={<PlusOutlined />}>创建虚拟机</Button></NavLink>
                ]
            }}
        />
    )
}
