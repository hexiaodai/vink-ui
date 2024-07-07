import { ListVirtualMachinesRequest, ManageVirtualMachinePowerStateRequestPowerState, VirtualMachine, VirtualMachineManagement as InternalVirtualMachineManagement, DeleteVirtualMachineRequest, CreateVirtualMachineRequest } from "@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb"
import { ListOptions } from "@/utils/search"
import { useCallback, useEffect, useState } from "react"
import { useVirtualMachineNotification } from '@/components/notification'

function generateOperationSummary(vms: VirtualMachine[], opresult: unknown[]): { type: string, desc: string } {
    const errors = opresult.filter(err => err !== null && err !== undefined)
    const successCount = vms.length - errors.length
    const type = errors.length === 0 ? "success" : errors.length >= vms.length ? "error" : "warning"
    const desc = `Success: ${successCount}, Failed: ${errors.length}`
    return { type, desc }
}

export class VirtualMachineManagement extends InternalVirtualMachineManagement {
    constructor() {
        super()
    }

    static async ManageVirtualMachinePowerStateWithNotification(vm: VirtualMachine, op: ManageVirtualMachinePowerStateRequestPowerState, showVirtualMachineNotification: any) {
        try {
            const request = { namespace: vm.namespace, name: vm.name, powerState: op }
            await InternalVirtualMachineManagement.ManageVirtualMachinePowerState(request)
            showVirtualMachineNotification.success("Power state changed successfully")
        } catch (err) {
            showVirtualMachineNotification.error(err)
        }
    }

    static async DeleteVirtualMachineWithNotification(vm: VirtualMachine, showVirtualMachineNotification: any) {
        try {
            const request = { namespace: vm.namespace, name: vm.name }
            await InternalVirtualMachineManagement.DeleteVirtualMachine(request)
            showVirtualMachineNotification.success("Virtual machine deleted successfully")
        } catch (err) {
            showVirtualMachineNotification.error(err)
        }
    }

    static async CreateVirtualMachineWithNotification(request: CreateVirtualMachineRequest, showVirtualMachineNotification: any) {
        try {
            await InternalVirtualMachineManagement.CreateVirtualMachine(request)
            showVirtualMachineNotification.success("Virtual machine create successfully")
            return Promise.resolve()
        } catch (err) {
            showVirtualMachineNotification.error(err)
            return Promise.reject(new Error(`failed to create virtual machine: ${err}`))
        }
    }

    static async BatchManageVirtualMachinePowerStateWithNotification(vms: VirtualMachine[], op: ManageVirtualMachinePowerStateRequestPowerState, showVirtualMachineNotification: any) {
        const result = await Promise.all(vms.map(async (vm) => {
            try {
                const request = { namespace: vm.namespace, name: vm.name, powerState: op }
                await InternalVirtualMachineManagement.ManageVirtualMachinePowerState(request)
                return null
            } catch (err) {
                return err
            }
        }))

        const errors = result.filter(err => err !== null && err !== undefined)
        const { type, desc } = generateOperationSummary(vms, errors)
        showVirtualMachineNotification.notify(type, desc)
    }

    static async BatchDeleteVirtualMachinesWithNotification(vms: VirtualMachine[], showVirtualMachineNotification: any) {
        const result = await Promise.all(vms.map(async (vm) => {
            try {
                const request = { namespace: vm.namespace, name: vm.name }
                await InternalVirtualMachineManagement.DeleteVirtualMachine(request)
                return null
            } catch (err) {
                return { vm, err }
            }
        }))

        const errors = result.filter(err => err !== null && err !== undefined)
        const { type, desc } = generateOperationSummary(vms, errors)
        showVirtualMachineNotification.notify(type, desc)
    }

    static UseVirtualMachines(initOpts: ListOptions) {
        const [opts, setOpts] = useState<ListOptions>(initOpts)
        const [data, setData] = useState<VirtualMachine[]>([])
        const [loading, setLoading] = useState(true)
        const { notificationContext, showVirtualMachineNotification } = useVirtualMachineNotification()

        const fetchData = useCallback(async () => {
            setLoading(true)
            try {
                const request: ListVirtualMachinesRequest = {
                    namespace: opts.namespace,
                    options: opts.opts,
                }
                const response = await InternalVirtualMachineManagement.ListVirtualMachines(request)
                setData(response.items || [])
                // showVirtualMachineNotification.success(`Fetched ${response.items?.length || 0} virtual machines`)
            } catch (err) {
                showVirtualMachineNotification.error(err)
            } finally {
                setLoading(false)
            }
        }, [opts])

        useEffect(() => {
            fetchData()
        }, [fetchData])

        return { opts, setOpts, data, loading, fetchData, notificationContext }
    }
}
