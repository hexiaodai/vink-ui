import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { clients } from "./clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { NotificationInstance } from "antd/lib/notification/interface"
import { generateMessage, jsonParse } from "@/utils/utils"
import { VirtualMachinePowerStateRequest_PowerState } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine"

export const createVirtualMachine = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VIRTUAL_MACHINE
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "VirtualMachine", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 虚拟机成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "VirtualMachine", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 虚拟机失败：${err.message}` })
            reject()
        })
    })
}

export const batchManageVirtualMachinePowerState = async (vms: CustomResourceDefinition[], state: VirtualMachinePowerStateRequest_PowerState, notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-manage-virtual-machine-power-state-success"
    const notificationFailedKey = "batch-manage-virtual-machine-power-state-failed"

    await Promise.all(vms.map(async (vm) => {
        const namespace = vm.metadata?.namespace!
        const name = vm.metadata?.name!
        const status = jsonParse(vm.status)
        const isRunning = status.printableStatus as string === "Running"

        if (state === VirtualMachinePowerStateRequest_PowerState.OFF && !isRunning) {
            return
        }
        if (state === VirtualMachinePowerStateRequest_PowerState.ON && isRunning) {
            return
        }
        if (state === VirtualMachinePowerStateRequest_PowerState.REBOOT && !isRunning) {
            return
        }

        try {
            await clients.virtualmachine.virtualMachinePowerState({
                namespaceName: { namespace: namespace, name: name },
                powerState: state
            }).response
            completed.push(vm)
            const msg = generateMessage(completed, `"{names}" 虚拟机正在执行操作`, `"{names}" 等 {count} 台虚拟机正在执行操作`)
            notification.success({ key: notificationSuccessKey, message: "VirtualMachine", description: msg })
        } catch (err: any) {
            failed.push(vm)
            const msg = generateMessage(failed, `"{names}" 虚拟机操作失败`, `"{names}" 等 {count} 虚拟机操作失败`)
            notification.error({ key: notificationFailedKey, message: "VirtualMachine", description: msg })
            console.log(err)
        }
        return
    }))
}

export const manageVirtualMachinePowerState = (namespace: string, name: string, state: VirtualMachinePowerStateRequest_PowerState, notification: NotificationInstance) => {
    const call = clients.virtualmachine.virtualMachinePowerState({
        namespaceName: { namespace: namespace, name: name },
        powerState: state
    })
    call.response.catch((err: Error) => {
        // alert(err)
        notification.error({ message: "VirtualMachine", description: err.message })
    })
}

export const deleteVirtualMachine = (namespace: string, name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: namespace, name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VIRTUAL_MACHINE
                }
            }
        })
        call.then(() => {
            notification.success({ message: "VirtualMachine", description: `删除 "${namespace}/${name}" 虚拟机成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "VirtualMachine", description: `删除 "${namespace}/${name}" 虚拟机失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteVirtualMachines = async (vms: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-virtual-machines-success"
    const notificationFailedKey = "batch-delete-virtual-machines-failed"

    await Promise.all(vms.map(async (vm) => {
        const namespace = vm.metadata?.namespace!
        const name = vm.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.VIRTUAL_MACHINE
                    }
                }
            }).response
            completed.push(vm)
            const msg = generateMessage(completed, `正在删除 "{names}" 虚拟机`, `正在删除 "{names}" 等 {count} 台虚拟机`)
            notification.success({ key: notificationSuccessKey, message: "VirtualMachine", description: msg })
        } catch (err: any) {
            failed.push(vm)
            const msg = generateMessage(failed, `删除 "{names}" 虚拟机失败`, `删除 "{names}" 等 {count} 台虚拟机失败`)
            notification.error({ key: notificationFailedKey, message: "VirtualMachine", description: msg })
            console.log(err)
        }
        return
    }))
}
