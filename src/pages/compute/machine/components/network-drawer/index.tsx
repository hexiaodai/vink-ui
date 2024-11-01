import { ProForm, ProFormCheckbox, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import { PlusOutlined } from '@ant-design/icons'
import { namespaceNameKey } from '@/utils/k8s'
import { getProvider } from '@/utils/utils'
import { NetworkConfig } from '../../vm'
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
        reset(formRef, setSelected, setEnabled, setMultus, setSubnets, setIPPools)
    }, [open])

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
                        <Button onClick={() => {
                            const fields = formRef.current?.getFieldsValue()
                            if (!selected.multus || !selected.subnet || !fields || !onConfirm) {
                                return
                            }
                            onConfirm({
                                network: fields.network,
                                interface: fields.interface,
                                ipAddress: fields.ipAddress,
                                macAddress: fields.macAddress,
                                default: fields.default,
                                multus: selected.multus,
                                subnet: selected.subnet,
                                ippool: selected.ippool
                            })
                        }
                        } type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text' onClick={() => reset(formRef, setSelected, setEnabled, setMultus, setSubnets, setIPPools)}>重置</Button>
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
                onReset={() => reset(formRef, setSelected, setEnabled, setMultus, setSubnets, setIPPools)}
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
                        onDropdownVisibleChange: async (open) => {
                            if (!open) {
                                return
                            }
                            try {
                                const items = await clients.fetchResources(GroupVersionResourceEnum.MULTUS)
                                setMultus(items)
                            } catch (err: any) {
                                notification.error({ message: err })
                            }
                        }
                    }}
                    onChange={(value: string) => {
                        const multusCR = multus.find(item => namespaceNameKey(item) === value)
                        setSelected((prevState) => ({ ...prevState, multus: multusCR }))

                        resetField(formRef, "subnet", setSubnets, setSelected, "subnet")
                        resetField(formRef, "ippool", setIPPools, setSelected, "ippool")
                    }}
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
                        onDropdownVisibleChange: async (open) => {
                            const multusCR = selected.multus
                            if (!open || !multusCR) {
                                return
                            }
                            const provider = getProvider(multusCR)
                            if (!provider) {
                                return
                            }
                            try {
                                const items = await clients.fetchResources(GroupVersionResourceEnum.SUBNET, {
                                    customFieldSelector: [`spec.provider=${provider}`]
                                })
                                setSubnets(items)
                            } catch (err: any) {
                                notification.error({ message: err })
                            }
                        }
                    }}
                    onChange={(value: string) => {
                        const subnet = subnets.find(item => item.metadata.name === value)
                        setSelected((prevState) => ({ ...prevState, subnet: subnet }))

                        resetField(formRef, "ippool", setIPPools, setSelected, "ippool")
                    }}
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
                                onDropdownVisibleChange: async (open) => {
                                    const subnet = selected.subnet
                                    if (!open || !subnet) {
                                        return
                                    }
                                    try {
                                        const items = await clients.fetchResources(GroupVersionResourceEnum.IPPOOL, {
                                            customFieldSelector: [`spec.subnet=${subnet.metadata.name}`]
                                        })
                                        setIPPools(items)
                                    } catch (err: any) {
                                        notification.error({ message: err })
                                    }
                                }
                            }}
                            onChange={(value: string) => {
                                const ippool = ippools.find(item => namespaceNameKey(item) === value)
                                setSelected((prevState) => ({ ...prevState, ippool: ippool }))
                            }}
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

const reset = (formRef: any, setSelected: any, setEnabled: any, setMultus: any, setSubnets: any, setIPPools: any) => {
    formRef.current?.resetFields()
    setSelected({ multus: null, subnet: null, ippool: null })
    setEnabled({ ip: false, mac: false, ippool: false })

    resetField(formRef, "multusCR", setMultus, setSelected, "multus")
    resetField(formRef, "subnet", setSubnets, setSelected, "subnet")
    resetField(formRef, "ippool", setIPPools, setSelected, "ippool")
}

const resetField = (formRef: any, fieldName: "multusCR" | "subnet" | "ippool", setList: any, setSelected: any, selectedKey: "multus" | "subnet" | "ippool") => {
    setList([])
    formRef.current?.resetFields([fieldName])
    setSelected((prevState: any) => ({ ...prevState, [selectedKey]: null }))
}
