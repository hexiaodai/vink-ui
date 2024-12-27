import { instances } from "@/clients/ts/label/labels.gen.ts"

export const getOperatingSystemFromDataVolume = (dv?: any): { family: string, version: string } => {
    const info = { family: "linux", version: "" }
    if (!dv) {
        return info
    }
    if (dv.metadata.labels?.[instances.VinkOperatingSystem.name]) {
        info.family = dv.metadata.labels[instances.VinkOperatingSystem.name].toLowerCase()
    }
    if (dv.metadata.labels?.[instances.VinkOperatingSystemVersion.name]) {
        info.version = dv.metadata.labels[instances.VinkOperatingSystemVersion.name].toLowerCase()
    }
    return info
}
