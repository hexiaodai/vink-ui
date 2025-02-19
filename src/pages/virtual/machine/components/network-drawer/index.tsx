import { ProForm, ProFormCheckbox, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey, namespaceNameString, parseNamespaceNameKey } from '@/utils/k8s'
import { getProvider } from '@/utils/utils'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import { Multus } from '@/clients/multus'
import { getSubnet, listSubnets, Subnet } from '@/clients/subnet'
import { IPPool } from '@/clients/ippool'
import { VirtualMachineNetwork } from '@/clients/ts/types/virtualmachine'
import type { ProFormInstance } from '@ant-design/pro-components'
import formStyles from "@/common/styles/form.module.less"
import { get, list } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'

interface NetworkProps {
    open: boolean
    networkConfig?: VirtualMachineNetwork
    onCanel?: () => void
    onConfirm?: (networkConfig: VirtualMachineNetwork) => void
}

interface formValues {
    network: string
    interface: string
    multus: string
    subnet: string
    ippool: string
    ipAddress: string
    macAddress: string
    default: boolean
}

export const NetworkDrawer: React.FC<NetworkProps> = ({ open, networkConfig, onCanel, onConfirm }) => {
    const { notification } = App.useApp()

    const formRef = useRef<ProFormInstance<formValues>>()

    const [multus, setMultus] = useState<Multus[]>()

    const [subnets, setSubnets] = useState<Subnet[]>()

    const [selected, setSelected] = useState<{ multus?: Multus, subnet?: Subnet, ippool?: IPPool }>()

    useEffect(() => {
        formRef.current?.resetFields()
        setSelected(undefined)
    }, [open])

    useEffect(() => {
        if (!networkConfig) {
            return
        }

        if (networkConfig.multus && networkConfig.multus.length > 0) {
            get<Multus>(ResourceType.MULTUS, parseNamespaceNameKey(networkConfig.multus), undefined, undefined, notification).then(data => {
                setSelected((pre => ({ ...pre, multus: data })))
            })
        }

        if (networkConfig.subnet && networkConfig.subnet.length > 0) {
            getSubnet({ namespace: "", name: networkConfig.subnet }, undefined, undefined, notification).then(data => {
                setSelected((pre => ({ ...pre, subnet: data })))
            })
        }
    }, [networkConfig])

    const handleMultusDropdownVisibleChange = (open: boolean) => {
        if (!open) {
            return
        }
        list<Multus>(ResourceType.MULTUS, setMultus, undefined, undefined, notification)
    }

    const handleSubnetDropdownVisibleChange = (open: boolean) => {
        if (!open || !selected || !selected.multus) {
            return
        }
        const provider = getProvider(selected.multus)
        if (!provider) {
            return
        }
        const opts = ListOptions.create({ fieldSelectorGroup: { fieldSelectors: [{ fieldPath: "spec.provider", operator: "=", values: [provider] }] } })
        listSubnets(setSubnets, opts, undefined, notification)
    }

    const handleConfirm = () => {
        const fields = formRef.current?.getFieldsValue()
        if (!selected || !selected.multus || !selected.subnet || !fields || !onConfirm) {
            return
        }
        onConfirm(VirtualMachineNetwork.create({
            name: networkConfig?.name || "",
            network: fields.network,
            interface: fields.interface,
            multus: namespaceNameString(selected.multus),
            subnet: selected.subnet.metadata!.name,
            default: fields.default,
            ip: fields.ipAddress,
            mac: fields.macAddress,
            vpc: selected.subnet.spec?.vpc,
        }))
    }

    const handleSelectMultus = (value: string) => {
        const multusCR = multus?.find(item => namespaceNameKey(item) === value)
        setSelected((prevState) => ({ ...prevState, multus: multusCR }))
        formRef.current?.resetFields(["subnet", "ippool"])
        setSubnets(undefined)
    }

    const handleSelectSubnet = (value: string) => {
        const subnet = subnets?.find(item => item.metadata!.name === value)
        setSelected((prevState) => ({ ...prevState, subnet: subnet }))
        formRef.current?.resetFields(["ippool"])
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
                        onDropdownVisibleChange: handleMultusDropdownVisibleChange
                    }}
                    onChange={handleSelectMultus}
                    options={
                        multus?.map((m: any) => ({ value: namespaceNameKey(m), label: namespaceNameKey(m) }))
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
                        onDropdownVisibleChange: handleSubnetDropdownVisibleChange
                    }}
                    onChange={handleSelectSubnet}
                    options={
                        subnets?.map((s: any) => ({ value: s.metadata.name, label: s.metadata.name }))
                    }
                    rules={[{
                        required: true,
                        message: "选择子网。"
                    }]}
                />

                <ProFormText
                    label="IP 地址"
                    name="ipAddress"
                    placeholder="输入 IP 地址，如果不输入，则自动分配"
                    initialValue={networkConfig?.ip}
                />

                <ProFormText
                    label="MAC 地址"
                    name="macAddress"
                    placeholder="输入 MAC 地址，如果不输入，则自动分配"
                    initialValue={networkConfig?.mac}
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
