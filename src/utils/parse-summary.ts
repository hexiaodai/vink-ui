// import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
// import { jsonParse, parseStatus } from "./utils"

export const virtualMachine = (virtualMachineSummarys?: any) => {
    return virtualMachineSummarys?.status?.virtualMachine
}

export const virtualMachineHost = (virtualMachineSummarys?: any) => {
    return virtualMachineSummarys?.status?.host
}

export const rootDisk = (virtualMachineSummarys?: any) => {
    const dvs = virtualMachineSummarys?.status?.dataVolumes
    return dvs?.find((dv: any) => {
        return dv.metadata?.labels["vink.kubevm.io/datavolume.type"] == "root"
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
    return virtualMachineSummarys?.status?.networks?.ips
}
