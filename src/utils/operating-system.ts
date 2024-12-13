import { instances } from "@/clients/ts/label/labels.gen.ts"

export const getOperatingSystemFromDataVolume = (metadata?: any): { family: string, version: string } => {
    const info = { family: "linux", version: "" }
    if (!metadata) {
        return info
    }
    if (metadata.labels[instances.VinkOperatingSystem.name]) {
        info.family = metadata.labels[instances.VinkOperatingSystem.name].toLowerCase()
    }
    if (metadata.labels[instances.VinkOperatingSystemVersion.name]) {
        info.version = metadata.labels[instances.VinkOperatingSystemVersion.name].toLowerCase()
    }
    return info
}
