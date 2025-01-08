import { DataVolume } from "@/clients/data-volume"
import { instances } from "@/clients/ts/label/labels.gen.ts"

export const getOperatingSystemFromDataVolume = (dv: DataVolume): { family: string, version: string } | undefined => {
    const family = dv.metadata!.labels?.[instances.VinkOperatingSystem.name]
    const version = dv.metadata!.labels?.[instances.VinkOperatingSystemVersion.name] || ""
    if (!family) {
        return
    }
    return { family, version }
}
