import { getErrorMessage } from "@/utils/utils"
import { virtualMachineClient } from "./clients"
import { VirtualMachinePowerStateRequest_PowerState } from "./ts/management/virtualmachine/v1alpha1/virtualmachine"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName } from "./ts/types/types"
import { NotificationInstance } from "antd/lib/notification/interface"

export type VirtualMachine = components["schemas"]["v1VirtualMachine"]

export const manageVirtualMachinePowerState = async (ns: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await virtualMachineClient.virtualMachinePowerState({
            namespaceName: ns,
            powerState: state
        })
    } catch (err) {
        notification?.error({ message: `Failed to change power state of virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}] to [State: ${state}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const manageVirtualMachinesPowerState = async (vms: VirtualMachine[], state: VirtualMachinePowerStateRequest_PowerState, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: VirtualMachine[] = []
        const failed: { vm: VirtualMachine; error: any }[] = []

        await Promise.all(vms.map(async (vm) => {
            const namespace = vm.metadata!.namespace
            const name = vm.metadata!.name

            const isRunning = vm.status?.printableStatus as string === "Running"

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
                await virtualMachineClient.virtualMachinePowerState({ namespaceName: { namespace, name }, powerState: state }).response
                completed.push(vm)
            } catch (err: any) {
                failed.push({ vm, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to change power state the following virtual machines:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to change power state of virtual machine to [State: ${state}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

