import { DataVolume } from "@/clients/data-volume"
import { instances as labels } from "@/clients/ts/label/labels.gen"
import { VirtualMachineSummary } from "@/clients/virtual-machine-summary"

export const virtualMachine = (summarys: VirtualMachineSummary) => {
    return summarys.status?.virtualMachine
}

export const virtualMachineInstance = (virtualMachineSummarys?: any) => {
    return virtualMachineSummarys?.status?.virtualMachineInstance
}

export const rootDisk = (virtualMachineSummarys: VirtualMachineSummary) => {
    return virtualMachineSummarys.status?.dataVolumes?.find((dv) => {
        dv = dv as DataVolume
        return dv.metadata!.labels?.[labels.VinkDatavolumeType.name] == "root"
    })
}

export const dataVolumes = (virtualMachineSummarys?: any, name?: string) => {
    const dvs = virtualMachineSummarys?.status?.dataVolumes
    if (!name) {
        return dvs
    }
    return dvs?.find((dv: any) => dv.metadata.name === name)
}

export const virtualMachineIPs = (virtualMachineSummarys?: any): any[] => {
    return virtualMachineSummarys?.status?.network?.ips
}
