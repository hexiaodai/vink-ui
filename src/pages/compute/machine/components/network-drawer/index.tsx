import { ProForm, ProFormCheckbox, ProFormSelect, ProFormText } from '@ant-design/pro-components'
import { App, Button, Drawer, Flex, Space } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { NamespaceName } from '@/clients/ts/types/types'
import { namespaceNameKey } from '@/utils/k8s'
import { getProvider } from '@/utils/utils'
import { ListOptions } from '@/clients/ts/management/resource/v1alpha1/resource'
import { getMultus, listMultus, Multus } from '@/clients/multus'
import { getSubnet, listSubnets, Subnet, VirtualMachineNetworkType } from '@/clients/subnet'
import { IPPool, listIPPools } from '@/clients/ippool'
import type { ProFormInstance } from '@ant-design/pro-components'
import formStyles from "@/common/styles/form.module.less"

interface NetworkProps {
    open: boolean
    networkConfig?: VirtualMachineNetworkType
    onCanel?: () => void
    onConfirm?: (networkConfig: VirtualMachineNetworkType) => void
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

    const [ippools, setIPPools] = useState<IPPool[]>()

    const [selected, setSelected] = useState<{ multus?: Multus, subnet?: Subnet, ippool?: IPPool }>()

    useEffect(() => {
        formRef.current?.resetFields()
        setSelected(undefined)
    }, [open])

    useEffect(() => {
        if (!networkConfig) {
            return
        }

        const multus = networkConfig.multus
        if (multus) {
            let multusNS: NamespaceName
            if ("metadata" in multus) {
                multusNS = { namespace: multus.metadata!.namespace, name: multus.metadata!.name }
            } else {
                multusNS = multus as NamespaceName
            }
            getMultus(multusNS, undefined, undefined, notification).then(data => {
                setSelected((pre => ({ ...pre, multus: data })))
            })
        }

        const subnet = networkConfig.subnet
        if (subnet) {
            let subnetNS: NamespaceName
            if (typeof subnet === "string") {
                subnetNS = { namespace: "", name: subnet }
            } else {
                subnetNS = { namespace: "", name: subnet.metadata!.name! }
            }
            getSubnet(subnetNS, undefined, undefined, notification).then(data => {
                setSelected((pre => ({ ...pre, subnet: data })))
            })
        }
    }, [networkConfig])

    const handleMultusDropdownVisibleChange = (open: boolean) => {
        if (!open) {
            return
        }
        listMultus(setMultus, undefined, undefined, notification)
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

    const handleIPPoolDropdownVisibleChange = (open: boolean) => {
        if (!open || !selected || !selected.subnet) {
            return
        }
        let subnetName = selected.subnet.metadata!.name!
        const opts = ListOptions.create({ fieldSelectorGroup: { fieldSelectors: [{ fieldPath: "spec.subnet", operator: "=", values: [subnetName] }] } })
        listIPPools(setIPPools, opts, undefined, notification)
    }

    const handleConfirm = () => {
        const fields = formRef.current?.getFieldsValue()
        if (!selected || !selected.multus || !selected.subnet || !fields || !onConfirm) {
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

    const handleSelectMultus = (value: string) => {
        const multusCR = multus?.find(item => namespaceNameKey(item) === value)
        setSelected((prevState) => ({ ...prevState, multus: multusCR }))
        formRef.current?.resetFields(["subnet", "ippool"])
        setSubnets(undefined)
        setIPPools(undefined)
    }

    const handleSelectSubnet = (value: string) => {
        const subnet = subnets?.find(item => item.metadata!.name === value)
        setSelected((prevState) => ({ ...prevState, subnet: subnet }))
        formRef.current?.resetFields(["ippool"])
        setIPPools(undefined)
    }

    const handleSelectIPPool = (value: string) => {
        const ippool = ippools?.find(item => item.metadata!.name === value)
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
                    {/* <Button type='text' onClick={reset}>重置</Button> */}
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
                // onReset={reset}
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
                    initialValue={networkConfig?.multus ? namespaceNameKey(networkConfig.multus) : undefined}
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

                <ProFormSelect
                    label="IP 地址池"
                    name="ippool"
                    placeholder="选择 IP 地址池，如果不选择，则自动分配"
                    initialValue={networkConfig?.ippool}
                    fieldProps={{
                        allowClear: false,
                        showSearch: true,
                        onDropdownVisibleChange: handleIPPoolDropdownVisibleChange
                    }}
                    onChange={handleSelectIPPool}
                    options={
                        ippools?.map((p: any) => ({ value: p.metadata?.name, label: p.metadata?.name }))
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
