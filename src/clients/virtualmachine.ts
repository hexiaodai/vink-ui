import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { clients } from "./clients"
import { NotificationInstance } from "antd/lib/notification/interface"
import { generateMessage, jsonParse } from "@/utils/utils"
import { VirtualMachinePowerStateRequest_PowerState } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine"

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
        notification.error({ message: "VirtualMachine", description: err.message })
    })
}
