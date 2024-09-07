import { instances } from "@kubevm.io/vink/label/labels.gen.ts"
import { ObjectMeta } from "@/apis/types/object_meta"

export const getOperatingSystemFromDataVolume = (metadata?: ObjectMeta): { family: string, version: string } => {
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
