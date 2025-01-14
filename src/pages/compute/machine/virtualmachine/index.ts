import { instances as labels } from '@/clients/ts/label/labels.gen'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import { generateKubeovnNetworkAnnon } from '@/utils/utils'
import { namespaceNameKey, parseNamespaceNameKey } from '@/utils/k8s'
import { NamespaceName } from '@/clients/ts/types/types'
import { VirtualMachine } from '@/clients/virtual-machine'
import { DataVolume } from '@/clients/data-volume'
import { VirtualMachineNetworkType } from '@/clients/subnet'

export const defaultNetworkAnno = "v1.multus-cni.io/default-network"

export const newVirtualMachine = (ns: NamespaceName, cm: { cpu: number, memory: number }, rootDisk: { image: DataVolume, capacity: number }, dataDisks: DataVolume[], netcfgs: VirtualMachineNetworkType[], cloudInit: string) => {
    console.log(ns, cm, rootDisk, dataDisks, netcfgs, cloudInit, "xxxx")
    const rootDiskName = generateRootDiskName(ns.name)

    const instance: VirtualMachine = {
        apiVersion: "kubevirt.io/v1",
        kind: "VirtualMachine",
        metadata: {
            name: ns.name,
            namespace: ns.namespace,
        },
        spec: {
            dataVolumeTemplates: [
                {
                    metadata: {
                        name: rootDiskName,
                        labels: {
                            [labels.VinkDatavolumeType.name]: "root",
                            [labels.VinkOperatingSystem.name]: rootDisk.image.metadata!.labels?.[labels.VinkOperatingSystem.name],
                            [labels.VinkOperatingSystemVersion.name]: rootDisk.image.metadata!.labels?.[labels.VinkOperatingSystemVersion.name],
                        },
                        annotations: {
                            [annotations.VinkDatavolumeOwner.name]: ns.name
                        }
                    },
                    spec: {
                        pvc: {
                            accessModes: ["ReadWriteOnce"],
                            resources: {
                                requests: {
                                    storage: `${rootDisk.capacity}Gi`,
                                },
                            },
                            storageClassName: "local-path",
                        },
                        source: {
                            pvc: {
                                name: rootDisk.image.metadata!.name,
                                namespace: rootDisk.image.metadata!.namespace,
                            },
                        },
                    },
                },
            ],
            runStrategy: "Always",
            template: {
                metadata: {
                    annotations: {}
                },
                spec: {
                    architecture: "amd64",
                    domain: {
                        cpu: {
                            cores: cm.cpu,
                            model: "host-model",
                            sockets: 1,
                            threads: 2
                        },
                        memory: {
                            guest: `${cm.memory}Gi`
                        },
                        devices: {
                            disks: [
                                {
                                    name: rootDiskName,
                                    disk: { bus: "virtio" },
                                    bootOrder: 1
                                },
                                {
                                    name: "cloudinit",
                                    disk: { bus: "virtio" }
                                }
                            ],
                            interfaces: []
                        },
                        features: {
                            acpi: {
                                enabled: true
                            }
                        },
                        machine: {
                            type: "q35"
                        },
                        resources: {
                            requests: {
                                memory: `${cm.memory / 2}Gi`,
                                cpu: `${250 * cm.cpu}m`
                            },
                            limits: {
                                memory: `${cm.memory}Gi`,
                                cpu: cm.cpu
                            }
                        }
                    },
                    networks: [],
                    volumes: [
                        {
                            name: rootDiskName,
                            dataVolume: {
                                name: rootDiskName
                            },
                        },
                        {
                            name: "cloudinit",
                            cloudInitNoCloud: {
                                userDataBase64: btoa(cloudInit)
                            }
                        }
                    ]
                }
            }
        }
    }

    generateDataDisks(instance, dataDisks)

    netcfgs.forEach(netcfg => {
        generateNetwork(instance, netcfg)
    })

    return instance
}

export const generateDataDisks = (vm: VirtualMachine, dataDisks: DataVolume[]) => {
    const additionalDataDisks = dataDisks.map((disk: any) => ({
        dataVolume: { name: disk.metadata.name },
        name: disk.metadata.name
    })) || []

    vm.spec.template.spec = vm.spec.template.spec || { domain: { devices: {} }, volumes: [] }
    vm.spec.template.spec.domain = vm.spec.template.spec.domain || { devices: {} }
    vm.spec.template.spec.domain.devices = vm.spec.template.spec.domain.devices || {}
    vm.spec.template.spec.volumes = vm.spec.template.spec.volumes || []
    vm.spec.template.spec.domain.devices.disks = vm.spec.template.spec.domain.devices.disks || []

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

// export interface NetworkConfig {
//     name?: string
//     network: string
//     interface: string
//     multus: NamespaceName | Multus
//     subnet: string | Subnet
//     ippool?: string | IPPool
//     ipAddress?: string
//     macAddress?: string
//     default?: boolean
// }

// export const generateNetwork = (vm: VirtualMachine, netcfg: NetworkConfig) => {
//     vm.spec.template.spec = vm.spec.template.spec || { domain: { devices: {} }, volumes: [] }
//     vm.spec.template.spec.domain = vm.spec.template.spec.domain || { devices: {} }
//     vm.spec.template.spec.networks = vm.spec.template.spec.networks || []

//     const multusNameMap = new Map<string, boolean>()
//     const networkNameMap = new Map<string, boolean>()
//     for (const element of vm.spec.template.spec.networks) {
//         if (element.multus) {
//             multusNameMap.set(element.multus.networkName, true)
//         }
//         networkNameMap.set(element.name, true)
//     }

//     if (vm.spec.template.metadata!.annotations?.[defaultNetworkAnno]) {
//         multusNameMap.set(vm.spec.template.metadata!.annotations[defaultNetworkAnno], true)
//     }

//     if (!netcfg.name) {
//         for (let number = 1; ; number++) {
//             const element = `net-${number}`
//             if (networkNameMap.has(element)) {
//                 continue
//             }
//             netcfg.name = element
//             break
//         }
//     }

//     vm.spec.template.spec.networks = vm.spec.template.spec.networks.filter((net: any) => {
//         return net.name !== netcfg.name
//     })

//     vm.spec.template.metadata!.annotations = vm.spec.template.metadata!.annotations || {}

//     let multusName = namespaceNameKey(netcfg.multus)

//     const net: any = { name: netcfg.name }
//     if (netcfg.interface === "masquerade") {
//         net.pod = {}
//         vm.spec.template.metadata!.annotations[defaultNetworkAnno] = multusName
//     } else {
//         net.multus = { default: netcfg.default, networkName: multusName }
//         if (vm.spec.template.metadata!.annotations[defaultNetworkAnno] === multusName) {
//             delete vm.spec.template.metadata!.annotations[defaultNetworkAnno]
//         }
//     }
//     vm.spec.template.spec.networks.push(net)

//     if (!vm.spec.template.spec.domain.devices.interfaces) {
//         vm.spec.template.spec.domain.devices.interfaces = []
//     }

//     vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces.filter((net: any) => {
//         return net.name !== netcfg.name
//     })
//     vm.spec.template.spec.domain.devices.interfaces.push({
//         name: netcfg.name,
//         [netcfg.interface]: {}
//     })

//     let subnetName = ""
//     if (typeof netcfg.subnet === "string") {
//         subnetName = netcfg.subnet
//     } else {
//         subnetName = netcfg.subnet.metadata!.name!
//     }

//     vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "logical_switch")] = subnetName

//     if (netcfg.ippool) {
//         let ippoolName = ""
//         if (typeof netcfg.ippool === "string") {
//             ippoolName = netcfg.ippool
//         } else if (typeof netcfg.ippool === "object") {
//             ippoolName = netcfg.ippool!.metadata.name
//         }

//         if (ippoolName.length > 0) {
//             vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_pool")] = ippoolName
//         }
//     }

//     if (netcfg.ipAddress && netcfg.ipAddress.length > 0) {
//         vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_address")] = netcfg.ipAddress
//     }

//     if (netcfg.macAddress && netcfg.macAddress.length > 0) {
//         vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "mac_address")] = netcfg.macAddress
//     }

//     configureNetworkDefault(vm.spec.template.spec.networks)
// }

export const generateNetwork = (vm: VirtualMachine, netcfg: VirtualMachineNetworkType) => {
    vm.spec.template.spec = vm.spec.template.spec || { domain: { devices: {} }, volumes: [] }
    vm.spec.template.spec.domain = vm.spec.template.spec.domain || { devices: {} }
    vm.spec.template.spec.networks = vm.spec.template.spec.networks || []

    const multusNameMap = new Map<string, boolean>()
    const networkNameMap = new Map<string, boolean>()
    for (const element of vm.spec.template.spec.networks) {
        if (element.multus) {
            multusNameMap.set(element.multus.networkName, true)
        }
        networkNameMap.set(element.name, true)
    }

    if (vm.spec.template.metadata!.annotations?.[defaultNetworkAnno]) {
        multusNameMap.set(vm.spec.template.metadata!.annotations[defaultNetworkAnno], true)
    }

    if (!netcfg.name) {
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

    vm.spec.template.metadata!.annotations = vm.spec.template.metadata!.annotations || {}

    let multusName = namespaceNameKey(netcfg.multus)

    const net: any = { name: netcfg.name }
    if (netcfg.interface === "masquerade") {
        net.pod = {}
        vm.spec.template.metadata!.annotations[defaultNetworkAnno] = multusName
    } else {
        net.multus = { default: netcfg.default, networkName: multusName }
        if (vm.spec.template.metadata!.annotations[defaultNetworkAnno] === multusName) {
            delete vm.spec.template.metadata!.annotations[defaultNetworkAnno]
        }
    }
    vm.spec.template.spec.networks.push(net)

    if (!vm.spec.template.spec.domain.devices.interfaces) {
        vm.spec.template.spec.domain.devices.interfaces = []
    }

    vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces.filter((net: any) => {
        return net.name !== netcfg.name
    })
    vm.spec.template.spec.domain.devices.interfaces.push({
        name: netcfg.name,
        [netcfg.interface]: {}
    })

    let subnetName = ""
    if (netcfg.subnet) {
        if (typeof netcfg.subnet === "string") {
            subnetName = netcfg.subnet
        } else {
            subnetName = netcfg.subnet.metadata!.name!
        }
    }

    vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "logical_switch")] = subnetName

    if (netcfg.ippool) {
        let ippoolName = ""
        if (typeof netcfg.ippool === "string") {
            ippoolName = netcfg.ippool
        } else {
            ippoolName = netcfg.ippool.metadata!.name
        }
        if (ippoolName.length > 0) {
            vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_pool")] = ippoolName
        }
    }

    if (netcfg.ipAddress && netcfg.ipAddress.length > 0) {
        vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "ip_address")] = netcfg.ipAddress
    }

    if (netcfg.macAddress && netcfg.macAddress.length > 0) {
        vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(netcfg.multus, "mac_address")] = netcfg.macAddress
    }

    configureNetworkDefault(vm.spec.template.spec.networks)
}

export const deleteNetwork = (vm: VirtualMachine, netName: string) => {
    vm.spec.template.spec = vm.spec.template.spec || { domain: { devices: {} }, volumes: [] }
    vm.spec.template.spec.domain = vm.spec.template.spec.domain || { devices: {} }
    vm.spec.template.spec.networks = vm.spec.template.spec.networks || []
    vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces || []

    const net = vm.spec.template.spec.networks.find((net: any) => net.name === netName)
    if (net && vm.spec.template.metadata!.annotations) {
        let ns: NamespaceName | undefined = undefined
        if (net.multus) {
            const part = net.multus.networkName.split("/")
            if (part && part.length === 2) {
                ns = { namespace: part[0], name: part[1] }
            }
        } else if (net.pod) {
            const value = vm.spec.template.metadata!.annotations[defaultNetworkAnno]
            if (value && value.length > 0) {
                ns = parseNamespaceNameKey(vm.spec.template.metadata!.annotations[defaultNetworkAnno])
                delete vm.spec.template.metadata!.annotations[defaultNetworkAnno]
            }
        }
        if (ns) {
            delete vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(ns, "ip_address")]
            delete vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(ns, "mac_address")]
            delete vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(ns, "ip_pool")]
            delete vm.spec.template.metadata!.annotations[generateKubeovnNetworkAnnon(ns, "logical_switch")]
        }
    }
    vm.spec.template.spec.domain.devices.interfaces = vm.spec.template.spec.domain.devices.interfaces.filter((net: any) => {
        return net.name !== netName
    })
    vm.spec.template.spec.networks = vm.spec.template.spec.networks.filter((net) => {
        return net.name !== netName
    })

    configureNetworkDefault(vm.spec.template.spec.networks)
}

const configureNetworkDefault = (networks: {
    multus?: { default?: boolean; networkName: string; }; name: string;
    pod?: { vmIPv6NetworkCIDR?: string; vmNetworkCIDR?: string; }
}[]) => {
    if (networks.length === 0) {
        return
    }
    if (networks.some((net) => net.pod)) {
        networks.forEach((net) => {
            if (net.multus) net.multus.default = false
        })
        return
    }

    const defaultNets = networks.filter((net) => net.multus && net.multus.default)
    if (defaultNets.length === 0) {
        networks[0].multus = networks[0].multus || { networkName: "", default: false }
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

export const defaultCloudInit = `
#cloud-config
ssh_pwauth: true
disable_root: false
chpasswd: {"list": "root:dangerous", expire: False}

runcmd:
- dhclient -r && dhclient
- sed -i "/#\?PermitRootLogin/s/^.*$/PermitRootLogin yes/g" /etc/ssh/sshd_config
- systemctl restart sshd.service
`
