import { ProForm, ProFormCheckbox, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'
import { namespaceNameKey, parseNamespaceNameKey } from '@/utils/k8s'
import { getErrorMessage, getProvider } from '@/utils/utils'
import { NetworkConfig } from '../../virtualmachine'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import type { ProFormInstance } from '@ant-design/pro-components'
import React from 'react'
import formStyles from "@/common/styles/form.module.less"

interface NetworkProps {
    open: boolean
    networkConfig?: NetworkConfig
    onCanel?: () => void
    onConfirm?: (networkConfig: NetworkConfig) => void
}

export const NetworkDrawer: React.FC<NetworkProps> = ({ open, networkConfig, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance>()

    const [multus, setMultus] = useState<any[]>([])
    const [subnets, setSubnets] = useState<any[]>([])
    const [ippools, setIPPools] = useState<any[]>([])

    const [selected, setSelected] = useState<{ multus: any, subnet: any, ippool: any }>({ multus: undefined, subnet: undefined, ippool: undefined })

    useEffect(() => {
        if (!open) return
        reset()
    }, [open])

    useEffect(() => {
        if (!networkConfig) {
            return
        }
        clients.getResource(ResourceType.MULTUS, parseNamespaceNameKey(networkConfig.multus)).then(crd => {
            setSelected((pre => ({ ...pre, multus: crd })))
        }).catch(err => {
            notification.error({ message: getResourceName(ResourceType.MULTUS), description: getErrorMessage(err) })
        })
        clients.getResource(ResourceType.SUBNET, parseNamespaceNameKey(networkConfig.subnet)).then(crd => {
            setSelected((pre => ({ ...pre, subnet: crd })))
        }).catch(err => {
            notification.error({ message: getResourceName(ResourceType.SUBNET), description: getErrorMessage(err) })
        })
    }, [networkConfig])

    const fetchMultusData = () => {
        clients.listResources(ResourceType.MULTUS).then(crds => {
            setMultus(crds)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.MULTUS),
                description: getErrorMessage(err)
            })
        })
    }

    const fetchSubnetsData = () => {
        const multusCR = selected.multus
        if (!multusCR) {
            return
        }
        const provider = getProvider(multusCR)
        if (!provider) {
            return
        }
        const opts = ListOptions.create({ fieldSelectorGroup: { fieldSelectors: [{ fieldPath: "spec.provider", operator: "=", values: [provider] }] } })
        clients.listResources(ResourceType.SUBNET, opts).then(crds => {
            setSubnets(crds)
        }).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.SUBNET),
                description: getErrorMessage(err)
            })
        })
    }

    const fetchIPPoolsData = () => {
        let subnetName = selected.subnet?.metadata.name
        if (!subnetName) {
            return
        }
        const opts = ListOptions.create({ fieldSelectorGroup: { fieldSelectors: [{ fieldPath: "spec.subnet", operator: "=", values: [subnetName] }] } })
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
        console.log(fields, selected)
        if (!selected.multus || !selected.subnet || !fields || !onConfirm) {
            return
        }
        onConfirm({
            name: networkConfig?.name,
            network: fields.network,
            interface: fields.interface,
            multus: selected.multus,
            subnet: selected.subnet,
            ippool: selected.ippool,
            default: fields.default,
            ipAddress: fields.ipAddress,
            macAddress: fields.macAddress
        })
    }

    const reset = () => {
        formRef.current?.resetFields()
        setSelected({ multus: null, subnet: null, ippool: null })
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
            title={networkConfig ? "编辑网络配置" : "添加网络配置"}
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
                    initialValue={networkConfig?.network || "multus"}
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
                    initialValue={networkConfig?.interface || "bridge"}
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
                    initialValue={networkConfig?.multus}
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: (open) => {
                            if (!open) return
                            fetchMultusData()
                        }
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
                    initialValue={networkConfig?.subnet}
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: (open) => {
                            if (!open) return
                            fetchSubnetsData()
                        }
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

                <ProFormSelect
                    label="IP 地址池"
                    name="ippool"
                    placeholder="选择 IP 地址池，如果不选择，则自动分配"
                    initialValue={networkConfig?.ippool}
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: (open) => {
                            if (!open) return
                            fetchIPPoolsData()
                        }
                    }}
                    onChange={handleSelectIPPool}
                    options={
                        ippools.map((p: any) => ({ value: p.metadata?.name, label: p.metadata?.name }))
                    }
                />

                <ProFormText
                    label="IP 地址"
                    name="ipAddress"
                    placeholder="输入 IP 地址，如果不输入，则自动分配"
                    initialValue={networkConfig?.ipAddress}
                />

                <ProFormText
                    label="MAC 地址"
                    name="macAddress"
                    placeholder="输入 MAC 地址，如果不输入，则自动分配"
                    initialValue={networkConfig?.macAddress}
                />

                <ProFormCheckbox
                    label="设为默认网络"
                    name="default"
                    initialValue={networkConfig?.default}
                />
            </ProForm>
        </Drawer>
    )
}
