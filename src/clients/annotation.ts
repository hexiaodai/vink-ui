import { KubeResource } from "./clients"
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { VirtualMachineDisk, VirtualMachineHost, VirtualMachineNetwork, VirtualMachineResourceMetrics } from "./ts/types/virtualmachine"
import { OperatingSystem } from "./ts/types/types"
import { NodeCephStorage } from "./ts/types/node"

export const getDisks = <T extends KubeResource>(cr: T | undefined) => {
    if (!cr) return
    const disksString = cr.metadata?.annotations?.[annotations.VinkDisks.name]
    if (!disksString) {
        return
    }
    return JSON.parse(disksString) as VirtualMachineDisk[]
}

export const getDisk = <T extends KubeResource>(cr: T | undefined, name: string) => {
    const disks = getDisks(cr)
    if (!disks || disks.length === 0) {
        return
    }
    return disks.find(disk => disk.name === name)
}

export const getNetworks = <T extends KubeResource>(cr: T | undefined): VirtualMachineNetwork[] => {
    if (!cr) return []
    const networksString = cr.metadata?.annotations?.[annotations.VinkNetworks.name]
    if (!networksString) {
        return []
    }
    return JSON.parse(networksString) as VirtualMachineNetwork[]
}

export const getHost = <T extends KubeResource>(cr: T | undefined) => {
    if (!cr) return
    const hostString = cr.metadata?.annotations?.[annotations.VinkHost.name]
    if (!hostString) {
        return
    }
    const host = JSON.parse(hostString) as VirtualMachineHost
    if (!host || !host.name) return
    if (!host.ips) host.ips = []
    return host
}

export const getVirtualMachineMonitor = <T extends KubeResource>(cr: T | undefined) => {
    if (!cr) return
    const monitorString = cr.metadata?.annotations?.[annotations.VinkMonitor.name]
    if (!monitorString) {
        return
    }
    return JSON.parse(monitorString) as VirtualMachineResourceMetrics
}

export const getVirtualMachineOperatingSystem = <T extends KubeResource>(cr: T | undefined) => {
    if (!cr) return
    const operatingSystemString = cr.metadata?.annotations?.[annotations.VinkOperatingSystem.name]
    if (!operatingSystemString) {
        return
    }
    return JSON.parse(operatingSystemString) as OperatingSystem
}

export interface NodeStorage extends NodeCephStorage {
    name: string
}

export const getNodeStorages = <T extends KubeResource>(cr: T | undefined) => {
    if (!cr) return
    const storageString = cr.metadata?.annotations?.[annotations.VinkStorage.name]
    if (!storageString) {
        return
    }
    const storages = JSON.parse(storageString) as NodeCephStorage[]
    return storages.map((storage) => {
        return { ...storage, name: cr.metadata?.name }
    })
}
