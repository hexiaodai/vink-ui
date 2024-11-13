import { ProForm, ProFormCheckbox, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { clients, emptyOptions, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/resource_type'
import { PlusOutlined } from '@ant-design/icons'
import { namespaceNameKey } from '@/utils/k8s'
import { getErrorMessage, getProvider } from '@/utils/utils'
import { NetworkConfig } from '../../virtualmachine'
import type { ProFormInstance } from '@ant-design/pro-components'
import React from 'react'
import formStyles from "@/common/styles/form.module.less"

interface NetworkProps {
    open?: boolean
    onCanel?: () => void
    onConfirm?: (networkConfig: NetworkConfig) => void
}

export const NetworkDrawer: React.FC<NetworkProps> = ({ open, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const [enabled, setEnabled] = useState<{ ip: boolean, mac: boolean, ippool: boolean }>({ ip: false, mac: false, ippool: false })

    const [multus, setMultus] = useState<any[]>([])
    const [subnets, setSubnets] = useState<any[]>([])
    const [ippools, setIPPools] = useState<any[]>([])

    const [selected, setSelected] = useState<{ multus: any, subnet: any, ippool: any }>({ multus: null, subnet: null, ippool: null })

    useEffect(() => {
        if (!open) return
        reset()
    }, [open])

    const handleMultusDropdownVisibleChange = (open: boolean) => {
        if (!open) {
            return
        }
        clients.listResources(ResourceType.MULTUS).then(crds => {
            setMultus(crds)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.MULTUS),
                description: getErrorMessage(err)
            })
        })
    }

    const handleSubnetDropdownVisibleChange = (open: boolean) => {
        const multusCR = selected.multus
        if (!open || !multusCR) {
            return
        }
        const provider = getProvider(multusCR)
        if (!provider) {
            return
        }
        const opts = emptyOptions({ customSelector: { fieldSelector: [`spec.provider=${provider}`], namespaceNames: [] } })
        clients.listResources(ResourceType.SUBNET, opts).then(crds => {
            setSubnets(crds)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.SUBNET),
                description: getErrorMessage(err)
            })
        })
    }

    const handleIPPoolDropdownVisibleChange = (open: boolean) => {
        const subnet = selected.subnet
        if (!open || !subnet) {
            return
        }
        const opts = emptyOptions({ customSelector: { fieldSelector: [`spec.subnet=${subnet.metadata.name}`], namespaceNames: [] } })
        clients.listResources(ResourceType.IPPOOL, opts).then(crds => {
            setIPPools(crds)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.IPPOOL),
                description: getErrorMessage(err)
            })
        })
    }

    const handleConfirm = () => {
        const fields = formRef.current?.getFieldsValue()
        if (!selected.multus || !selected.subnet || !fields || !onConfirm) {
            return
        }
        onConfirm({
            network: fields.network, interface: fields.interface,
            ipAddress: fields.ipAddress, macAddress: fields.macAddress,
            default: fields.default, multus: selected.multus,
            subnet: selected.subnet, ippool: selected.ippool
        })
    }

    const reset = () => {
        formRef.current?.resetFields()
        setSelected({ multus: null, subnet: null, ippool: null })
        setEnabled({ ip: false, mac: false, ippool: false })
    }

    const handleSelectMultus = (value: string) => {
        const multusCR = multus.find(item => namespaceNameKey(item) === value)
        setSelected((prevState) => ({ ...prevState, multus: multusCR }))
        formRef.current?.resetFields(["subnet", "ippool"])
        setSubnets([])
        setIPPools([])
    }

    const handleSelectSubnet = (value: string) => {
        const subnet = subnets.find(item => item.metadata.name === value)
        setSelected((prevState) => ({ ...prevState, subnet: subnet }))
        formRef.current?.resetFields(["ippool"])
        setIPPools([])
    }

    const handleSelectIPPool = (value: string) => {
        const ippool = ippools.find(item => item.metadata.name === value)
        setSelected((prevState) => ({ ...prevState, ippool: ippool }))
    }

    return (
        <Drawer
            title="添加网络"
            open={open}
            onClose={onCanel}
            closeIcon={false}
            width={650}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={handleConfirm} type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text' onClick={reset}>重置</Button>
                </Flex>
            }
        >
            <ProForm
                className={formStyles["required-label-right-indicator-form"]}
                labelCol={{ span: 6 }}
                layout="horizontal"
                labelAlign="left"
                colon={false}
                formRef={formRef}
                onReset={reset}
                submitter={false}
            >
                <ProFormSelect
                    label="Network"
                    name="network"
                    placeholder="选择网络"
                    initialValue={"multus"}
                    fieldProps={{ allowClear: false, showSearch: true }}
                    options={[
                        { value: 'multus', label: 'multus' },
                        { value: 'pod', label: 'pod' }
                    ]}
                    rules={[{
                        required: true,
                        message: "选择网络"
                    }]}
                />

                <ProFormSelect
                    label="Interface"
                    name="interface"
                    placeholder="选择网络接口"
                    initialValue={"bridge"}
                    fieldProps={{ allowClear: false, showSearch: true }}
                    options={[
                        { value: 'masquerade', label: 'masquerade' },
                        { value: 'bridge', label: 'bridge' },
                        { value: 'slirp', label: 'slirp' },
                        { value: 'sriov', label: 'sriov' }
                    ]}
                    rules={[{
                        required: true,
                        message: "选择网络接口"
                    }]}
                />
                <ProFormSelect
                    label="Multus CR"
                    name="multusCR"
                    placeholder="选择 Multus CR"
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: handleMultusDropdownVisibleChange
                    }}
                    onChange={handleSelectMultus}
                    options={
                        multus.map((m: any) => ({ value: namespaceNameKey(m), label: namespaceNameKey(m) }))
                    }
                    rules={[{
                        required: true,
                        message: "选择 Multus CR。"
                    }]}
                />
                <ProFormSelect
                    label="子网"
                    name="subnet"
                    placeholder="选择子网"
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: handleSubnetDropdownVisibleChange
                    }}
                    onChange={handleSelectSubnet}
                    options={
                        subnets.map((s: any) => ({ value: s.metadata.name, label: s.metadata.name }))
                    }
                    rules={[{
                        required: true,
                        message: "选择子网。"
                    }]}
                />

                <ProFormItem label="IP 地址池">
                    {
                        enabled.ippool &&
                        <ProFormSelect
                            name="ippool"
                            placeholder="选择 IP 地址池"
                            fieldProps={{
                                allowClear: false,
                                showSearch: true,
                                onDropdownVisibleChange: handleIPPoolDropdownVisibleChange
                            }}
                            onChange={handleSelectIPPool}
                            options={
                                ippools.map((p: any) => ({ value: p.metadata?.name, label: p.metadata?.name }))
                            }
                        />
                    }
                    <Button
                        color="default"
                        disabled={ippools.length == 0 && !enabled.ippool}
                        icon={<PlusOutlined />}
                        variant="text"
                        onClick={() => {
                            setEnabled((prevState) => ({ ...prevState, ippool: !prevState.ippool }))
                        }}
                    >
                        {enabled.ippool ? "自动分配 IP 地址池" : "自定义 IP 地址池"}
                    </Button>
                </ProFormItem>

                <ProFormItem label="IP 地址">
                    {
                        enabled.ip &&
                        <ProFormText
                            name="ipAddress"
                            placeholder={enabled.ippool ? "从 IP 地址池中选择一个 IP 地址" : "从子网中选择一个 IP 地址"}
                        />
                    }
                    <Button
                        color="default"
                        disabled={subnets.length == 0 && !enabled.ip}
                        icon={<PlusOutlined />}
                        variant="text"
                        onClick={() => {
                            formRef.current?.resetFields(["ipAddress"])
                            setEnabled((prevState) => ({ ...prevState, ip: !prevState.ip }))
                        }}
                    >
                        {enabled.ip ? "自动分配 IP 地址" : "自定义 IP 地址"}
                    </Button>
                </ProFormItem>

                <ProFormItem label="MAC 地址">
                    {
                        enabled.mac &&
                        <ProFormText
                            name="macAddress"
                            placeholder="输入 MAC 地址"
                        />
                    }
                    <Button
                        color="default"
                        icon={<PlusOutlined />}
                        variant="text"
                        onClick={() => {
                            formRef.current?.resetFields(["macAddress"])
                            setEnabled((prevState) => ({ ...prevState, mac: !prevState.mac }))
                        }}
                    >
                        {enabled.mac ? "自动分配 MAC 地址" : "自定义 MAC 地址"}
                    </Button>
                </ProFormItem>

                <ProFormCheckbox
                    label="设为默认网络"
                    name="default"
                />
            </ProForm>
        </Drawer>
    )
}
