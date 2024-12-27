import { instances as labels } from "@/clients/ts/label/labels.gen"

export const virtualMachine = (virtualMachineSummarys?: any) => {
    return virtualMachineSummarys?.status?.virtualMachine
}

export const virtualMachineInstance = (virtualMachineSummarys?: any) => {
    return virtualMachineSummarys?.status?.virtualMachineInstance
}

export const rootDisk = (virtualMachineSummarys?: any) => {
    const dvs = virtualMachineSummarys?.status?.dataVolumes
    return dvs?.find((dv: any) => {
        return dv.metadata.labels?.[labels.VinkDatavolumeType.name] == "root"
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
