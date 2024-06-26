import { instances } from "@kubevm.io/vink/label/labels.gen.ts"

export const getOperatingSystemFromDataVolume = (dv?: any): { family: string, version: string } => {
    const info = { family: 'linux', version: '' }
    if (!dv?.metadata?.labels) {
        return info
    }
    const labels = dv.metadata.labels
    if (labels[instances.VinkVirtualmachineOs.name]) {
        info.family = labels[instances.VinkVirtualmachineOs.name].toLowerCase()
    }
    if (labels[instances.VinkVirtualmachineVersion.name]) {
        info.version = labels[instances.VinkVirtualmachineVersion.name].toLowerCase()
    }
    return info
}
