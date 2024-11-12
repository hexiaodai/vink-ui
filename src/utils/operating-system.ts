import { instances } from "@kubevm.io/vink/label/labels.gen.ts"

export const getOperatingSystemFromDataVolume = (metadata?: any): { family: string, version: string } => {
    const info = { family: "linux", version: "" }
    if (!metadata) {
        return info
    }
    if (metadata.labels[instances.VinkVirtualmachineOs.name]) {
        info.family = metadata.labels[instances.VinkVirtualmachineOs.name].toLowerCase()
    }
    if (metadata.labels[instances.VinkVirtualmachineVersion.name]) {
        info.version = metadata.labels[instances.VinkVirtualmachineVersion.name].toLowerCase()
    }
    return info
}
