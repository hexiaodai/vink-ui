import { ProForm, ProFormItem, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { fetchMultus } from '@/resource-manager/multus'
import { CustomResourceDefinition } from '@/apis/apiextensions/v1alpha1/custom_resource_definition'
import { fetchSubnets } from '@/resource-manager/subnet'
import { jsonParse, parseSpec } from '@/utils/utils'
import { fetchIPPools } from '@/resource-manager/ippool'
import type { ProFormInstance } from '@ant-design/pro-components'
import React from 'react'
import styles from './styles/network-drawer.module.less'
import formStyles from "@/common/styles/form.module.less"

interface NetworkProps {
    open: boolean
    namespace: string
    onCanel: () => void
    onConfirm: (networkConfig: NetworkConfig) => void
}

export interface NetworkConfig {
    networkMode: string
    multusCR: CustomResourceDefinition
    subnet: CustomResourceDefinition
    ippool?: CustomResourceDefinition
    ipAddress?: string
    macAddress?: string
}

const filterSubnets = (multus: CustomResourceDefinition[], subnets: CustomResourceDefinition[], multusCRName: string) => {
    const multusCR = multus.find(item => item.metadata?.name === multusCRName)
    if (!multusCR) {
        return
    }
    const provider = getProvider(multusCR)
    if (!provider || provider.length == 0) {
        return
    }
    return subnets.filter(item => jsonParse(item.spec).provider === provider)
}

const filterIPPools = (ippools: CustomResourceDefinition[], subnetName: string) => {
    return ippools.filter(item => {
        return parseSpec(item).subnet == subnetName
    })
}

const generateNetworkConfig = (formRef: React.MutableRefObject<ProFormInstance | undefined>, multus: CustomResourceDefinition[], subnets: CustomResourceDefinition[], ippools: CustomResourceDefinition[]) => {
    const multusCR = multus.find(item => item.metadata?.name === formRef.current?.getFieldValue("multusCR"))
    if (!multusCR) {
        return
    }
    const subnet = subnets.find(item => item.metadata?.name === formRef.current?.getFieldValue("subnet"))
    if (!subnet) {
        return
    }
    return {
        networkMode: formRef.current?.getFieldValue("networkMode"),
        multusCR: multusCR,
        subnet: subnet,
        ippool: ippools.find(item => item.metadata?.name === formRef.current?.getFieldValue("ippool")),
        ipAddress: formRef.current?.getFieldValue("ipAddress"),
        macAddress: formRef.current?.getFieldValue("macAddress")
    }
}

const getProvider = (multusCR: CustomResourceDefinition) => {
    const kubeovn = "kube-ovn"
    const config = jsonParse(jsonParse(multusCR.spec).config)
    if (config.type == kubeovn) {
        return config.provider
    }
    if (!config.plugins) {
        return
    }
    for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i]
        if (plugin.type == kubeovn) {
            return plugin.provider
        }
    }
    return
}

export const NetworkDrawer: React.FC<NetworkProps> = ({ open, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const [enableCustomIP, setEnableCustomIP] = useState(false)
    const [enableCustomMAC, setEnableCustomMAC] = useState(false)
    const [enableCustomIPPool, setEnableCustomIPPool] = useState(false)

    const [multus, setMultus] = useState<CustomResourceDefinition[]>([])
    const [subnets, setSubnets] = useState<CustomResourceDefinition[]>([])
    const [ippools, setIPPools] = useState<CustomResourceDefinition[]>([])
    const [filteredSubnets, setFilteredSubnets] = useState<CustomResourceDefinition[]>([])
    const [filteredIPPools, setFilteredIPPools] = useState<CustomResourceDefinition[]>([])

    useEffect(() => {
        if (!open) return

        reset()

        fetchMultus(setMultus, {}, notification)
        fetchSubnets(setSubnets, {}, notification)
        fetchIPPools(setIPPools, {}, notification)
    }, [open])

    const reset = () => {
        formRef.current?.resetFields()
        setFilteredSubnets([])
        setFilteredIPPools([])
    }

    return (
        <Drawer
            className={styles["network-drawer"]}
            title="添加网络"
            open={open}
            onClose={onCanel}
            closeIcon={false}
            width={500}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={() => {
                            const cfg = generateNetworkConfig(formRef, multus, subnets, ippools)
                            if (!cfg) {
                                return
                            }
                            onConfirm(cfg)
                        }
                        } type="primary">确定</Button>
                        <Button onClick={onCanel}>取消</Button>
                    </Space>
                    <Button type='text' onClick={() => reset()}>重置</Button>
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
                onReset={() => reset()}
                submitter={false}
            >
                <ProFormSelect
                    label="网络模式"
                    name="networkMode"
                    placeholder="选择网络模式"
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
                        message: "选择网络模式。"
                    }]}
                />
                <ProFormSelect
                    label="Multus CR"
                    name="multusCR"
                    placeholder="选择 Multus CR"
                    fieldProps={{ allowClear: false, showSearch: true }}
                    onChange={(value: string) => {
                        formRef.current?.resetFields(["subnet", "ippool"])
                        setFilteredIPPools([])
                        setFilteredSubnets(filterSubnets(multus, subnets, value) || [])
                    }}
                    options={
                        multus.map((m: CustomResourceDefinition) => ({ value: m.metadata?.name, label: m.metadata?.name }))
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
                    fieldProps={{ allowClear: false, showSearch: true }}
                    onChange={(value: string) => {
                        formRef.current?.resetFields(["ippool"])
                        setFilteredIPPools(filterIPPools(ippools, value))
                    }}
                    options={
                        filteredSubnets.map((s: CustomResourceDefinition) => ({ value: s.metadata?.name, label: s.metadata?.name }))
                    }
                    rules={[{
                        required: true,
                        message: "选择子网。"
                    }]}
                />

                <ProFormItem label="IP 地址池">
                    <Space direction='vertical' style={{ width: "100%" }}>
                        {
                            enableCustomIPPool &&
                            <ProFormSelect
                                name="ippool"
                                placeholder="选择 IP 地址池"
                                options={filteredIPPools.map((pool: CustomResourceDefinition) => ({
                                    value: pool.metadata?.name,
                                    label: pool.metadata?.name,
                                }))}
                            />
                        }
                        <Button
                            type="dashed"
                            disabled={filteredIPPools.length == 0}
                            onClick={() => {
                                formRef.current?.resetFields(["ippool"])
                                setEnableCustomIPPool(!enableCustomIPPool)
                            }}
                        >
                            {enableCustomIPPool ? "自动分配 IP 地址池" : "自定义 IP 地址池"}
                        </Button>
                    </Space>
                </ProFormItem>

                <ProFormItem label="IP 地址">
                    <Space direction='vertical' style={{ width: "100%" }}>
                        {
                            enableCustomIP &&
                            <ProFormText
                                name="ipAddress"
                                placeholder={enableCustomIPPool ? "从 IP 地址池中选择一个 IP 地址" : "从子网中选择一个 IP 地址"}
                            />
                        }
                        <Button
                            type="dashed"
                            disabled={filteredSubnets.length == 0}
                            onClick={() => {
                                formRef.current?.resetFields(["ipAddress"])
                                setEnableCustomIP(!enableCustomIP)
                            }}
                        >
                            {enableCustomIPPool ? "自动分配 IP 地址" : "自定义 IP 地址"}
                        </Button>
                    </Space>
                </ProFormItem>

                <ProFormItem label="MAC 地址">
                    <Space direction='vertical' style={{ width: "100%" }}>
                        {
                            enableCustomMAC &&
                            <ProFormText
                                name="macAddress"
                                placeholder="输入 MAC 地址"
                            />
                        }
                        <Button
                            type="dashed"
                            disabled={filteredSubnets.length == 0}
                            onClick={() => {
                                formRef.current?.resetFields(["macAddress"])
                                setEnableCustomMAC(!enableCustomMAC)
                            }}
                        >
                            {enableCustomMAC ? "自动分配 MAC 地址" : "自定义 MAC 地址"}
                        </Button>
                    </Space>
                </ProFormItem>
            </ProForm>
        </Drawer>
    )
}
