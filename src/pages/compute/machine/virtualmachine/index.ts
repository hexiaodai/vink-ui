import { instances as labels } from '@/clients/ts/label/labels.gen'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { generateKubeovnNetworkAnnon } from '@/utils/utils'
import { namespaceNameKey, parseNamespaceNameKey } from '@/utils/k8s'
import { virtualmachineYaml } from './template'
import { NamespaceName } from '@/clients/ts/types/types'
import * as yaml from 'js-yaml'

export const defaultNetworkAnno = "v1.multus-cni.io/default-network"

export const newVirtualMachine = (ns: NamespaceName, cm: { cpu: number, memory: number }, rootDisk: { image: any, capacity: number }, dataDisks: any[], netcfgs: NetworkConfig[], cloudInit: string) => {
    const instance: any = yaml.load(virtualmachineYaml)

    instance.metadata.name = ns.name
    instance.metadata.namespace = ns.namespace

    updateCpuMem(instance, cm.cpu, cm.memory)
    updateRootDisk(instance, rootDisk.image, rootDisk.capacity)
    updateDataDisks(instance, dataDisks)
    updateCloudInit(instance, cloudInit)

    netcfgs.forEach(netcfg => {
        updateNetwork(instance, netcfg)
    })

    return instance
}

export const updateCpuMem = (vm: any, cpu: number, memory: number) => {
    vm.spec.template.spec.domain.cpu.cores = cpu
    vm.spec.template.spec.domain.memory.guest = `${memory}Gi`

    vm.spec.template.spec.domain.resources.requests.memory = `${memory / 2}Gi`
    vm.spec.template.spec.domain.resources.requests.cpu = `${250 * cpu}m`

    vm.spec.template.spec.domain.resources.limits.memory = `${memory}Gi`
    vm.spec.template.spec.domain.resources.limits.cpu = cpu
}

export const updateRootDisk = (vm: any, image: any, capacity: number) => {
    const rootDiskName = generateRootDiskName(vm.metadata.name)

    vm.spec.dataVolumeTemplates[0].metadata.name = rootDiskName
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkDatavolumeType.name] = "root"
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineOs.name] = image.metadata.labels[labels.VinkVirtualmachineOs.name]
    vm.spec.dataVolumeTemplates[0].metadata.labels[labels.VinkVirtualmachineVersion.name] = image.metadata.labels[labels.VinkVirtualmachineVersion.name]
    vm.spec.dataVolumeTemplates[0].metadata.annotations[annotations.VinkVirtualmachineBinding.name] = vm.metadata.name
    vm.spec.dataVolumeTemplates[0].spec.pvc.resources.requests.storage = `${capacity}Gi`
    vm.spec.dataVolumeTemplates[0].spec.source.pvc.name = image.metadata.name
    vm.spec.dataVolumeTemplates[0].spec.source.pvc.namespace = image.metadata.namespace

    const additionalRootDisk = { dataVolume: { name: rootDiskName }, name: rootDiskName }
    vm.spec.template.spec.volumes.push(additionalRootDisk)

    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks.filter((disk: any) => {
        if (disk.bootOrder === 1) {
            delete disk.bootOrder
        }
        return disk.name !== additionalRootDisk.name
    })

    vm.spec.template.spec.domain.devices.disks.push({
        name: additionalRootDisk.name,
        disk: { bus: "virtio" },
        bootOrder: 1
    })
}

export const updateDataDisks = (vm: any, dataDisks: any[]) => {
    const additionalDataDisks = dataDisks.map((disk: any) => ({
        dataVolume: { name: disk.metadata.name },
        name: disk.metadata.name
    })) || []
    const allVolumes = [...vm.spec.template.spec.volumes, ...additionalDataDisks]
    vm.spec.template.spec.volumes = Array.from(
        new Map(allVolumes.map((vol) => [vol.name, vol])).values()
    )

    const additionalDisks = additionalDataDisks.map((disk: any) => ({
        name: disk.name,
        disk: { bus: "virtio" }
    }))
    const allDisks = [...vm.spec.template.spec.domain.devices.disks, ...additionalDisks]
    vm.spec.template.spec.domain.devices.disks = Array.from(
        new Map(allDisks.map((disk) => [disk.name, disk])).values()
    )

    const cloudinitVolIdx = vm.spec.template.spec.volumes.findIndex((vol: any) => vol.cloudInitNoCloud)
    if (cloudinitVolIdx > -1) {
        const [volume] = vm.spec.template.spec.volumes.splice(cloudinitVolIdx, 1)
        vm.spec.template.spec.volumes.push(volume)
    }
}

export const updateCloudInit = (vm: any, cloudInit: string) => {
    const additionalCloudInit = { cloudInitNoCloud: { userDataBase64: btoa(cloudInit) }, name: "cloudinit" }
    vm.spec.template.spec.volumes = vm.spec.template.spec.volumes.filter((vol: any) => {
        return !vol.cloudInitNoCloud
    })
    vm.spec.template.spec.volumes.push(additionalCloudInit)

    vm.spec.template.spec.domain.devices.disks.push({
        name: additionalCloudInit.name,
        disk: { bus: "virtio" }
    })
    vm.spec.template.spec.domain.devices.disks = Array.from(
        new Map(vm.spec.template.spec.domain.devices.disks.map((disk: any) => [disk.name, disk])).values()
    )
}

export interface NetworkConfig {
    name?: string
    network: "multus" | "pod"
    interface: "masquerade" | "bridge" | "slirp" | "sriov"
    multus: NamespaceName | any
    subnet: string | any
    ippool?: string | any
    ipAddress?: string
    macAddress?: string
    default?: boolean
}

export const updateNetwork = (vm: any, netcfg: NetworkConfig) => {
    const isAddAction = (!netcfg.name || netcfg.name.length === 0)

    const multusNameMap = new Map<string, boolean>()
    const networkNameMap = new Map<string, boolean>()
    for (const element of vm.spec.template.spec.networks) {
        if (element.multus) {
            multusNameMap.set(element.multus.networkName, true)
        }
        networkNameMap.set(element.name, true)
    }

    if (vm.spec.template.metadata.annotations?.[defaultNetworkAnno]) {
        multusNameMap.set(vm.spec.template.metadata.annotations[defaultNetworkAnno], true)
    }

    if (isAddAction && multusNameMap.has(namespaceNameKey(netcfg.multus))) {
        throw new Error(
            `Invalid network configuration: 'name' is required but missing or empty. Additionally, a configuration with the same key (${namespaceNameKey(netcfg.multus)}) already exists in multusNameMap.`
        )
    }

    if (isAddAction) {
        for (let number = 1; ; number++) {
            const element = `net-${number}`
            if (networkNameMap.has(element)) {
                continue
            }
            netcfg.name = element
            break
        }
    }

    vm.spec.template.spec.networks = vm.spec.template.spec.networks.filter((net: any) => {
        return net.name !== netcfg.name
    })

    if (!vm.spec.template.metadata.annotations) {
        vm.spec.template.metadata.annotations = {}
    }

    let multusName = namespaceNameKey(netcfg.multus)

    const net: any = { name: netcfg.name }
    if (netcfg.interface === "masquerade") {
        net.pod = {}
        vm.spec.template.metadata.annotations[defaultNetworkAnno] = multusName
    } else {
        net.multus = { default: netcfg.default, networkName: multusName }
        if (vm.spec.template.metadata.annotations?.[defaultNetworkAnno] === multusName) {
            delete vm.spec.template.metadata.annotations[defaultNetworkAnno]
        }
    }
    vm.spec.template.spec.networks.push(net)

    vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces.filter((net: any) => {
        return net.name !== netcfg.name
    })
    vm.spec.template.spec.domain.devices.interfaces.push({
        name: netcfg.name,
        [netcfg.interface]: {}
    })

    let subnetName = netcfg.subnet
    if (typeof netcfg.subnet === "object") {
        subnetName = netcfg.subnet.metadata.name
    }

    vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "logical_switch")] = subnetName

    if (netcfg.ippool) {
        let ippoolName = netcfg.ippool
        if (typeof netcfg.ippool === "object") {
            ippoolName = netcfg.ippool.metadata.name
        }
        if (ippoolName.length > 0) {
            vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_pool")] = ippoolName
        }
    }

    if (netcfg.ipAddress && netcfg.ipAddress.length > 0) {
        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_address")] = netcfg.ipAddress
    }

    if (netcfg.macAddress && netcfg.macAddress.length > 0) {
        vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "mac_address")] = netcfg.macAddress
    }

    configureNetworkDefault(vm.spec.template.spec.networks)
}

export const deleteNetwork = (vm: any, netName: string) => {
    const net = vm.spec.template.spec.networks.find((net: any) => net.name === netName)
    if (net && vm.spec.template.metadata.annotations) {
        let ns: NamespaceName | undefined = undefined
        if (net.multus) {
            const part = net.multus.networkName.split("/")
            if (part && part.length === 2) {
                ns = { namespace: part[0], name: part[1] }
            }
        } else if (net.pod) {
            const value = vm.spec.template.metadata.annotations[defaultNetworkAnno]
            if (value && value.length > 0) {
                ns = parseNamespaceNameKey(vm.spec.template.metadata.annotations[defaultNetworkAnno])
                delete vm.spec.template.metadata.annotations[defaultNetworkAnno]
            }
        }
        if (ns) {
            delete vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(ns, "ip_address")]
            delete vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(ns, "mac_address")]
            delete vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(ns, "ip_pool")]
            delete vm.spec.template.metadata.annotations[generateKubeovnNetworkAnnon(ns, "logical_switch")]
        }
    }
    vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces.filter((net: any) => {
        return net.name !== netName
    })
    vm.spec.template.spec.networks = vm.spec.template.spec.networks.filter((net: any) => {
        return net.name !== netName
    })

    configureNetworkDefault(vm.spec.template.spec.networks)
}

const configureNetworkDefault = (networks: any[]) => {
    if (networks.some((net) => net.pod)) {
        networks.forEach((net) => {
            if (net.multus) net.multus.default = false
        })
        return
    }

    const defaultNets = networks.filter((net) => net.multus && net.multus.default)
    if (defaultNets.length === 0) {
        networks[0].multus.default = true
        return
    }
    if (defaultNets.length == 1) {
        return
    }

    defaultNets.pop()
    const mp = new Map<string, boolean>(
        defaultNets.map((net) => [net.name, true])
    )
    networks.forEach((net) => {
        if (mp.has(net.name) && net.multus) {
            net.multus.default = false
        }
    })
}

const generateRootDiskName = (name: string) => {
    return `${name}-root`
}
