import { namespaceNameKey, parseNamespaceNameKey } from "@/utils/k8s"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { FieldSelector, NamespaceName, ResourceType } from "./ts/types/types"
import { VirtualMachineSummary } from "./virtual-machine-summary"
import { defaultNetworkAnno } from "@/pages/virtual/virtualmachine"
import { generateKubeovnNetworkAnnon, getErrorMessage, getProvider, isAbortedError, resourceSort } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"
import { Multus } from "./multus"
import { IPPool } from "./ippool"
import { IP } from "./ip"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"

export type Subnet = components["schemas"]["v1Subnet"]

export type VirtualMachineNetworkType = {
    name?: string
    default: boolean
    network: string
    interface: string
    multus?: NamespaceName | Multus
    vpc?: string
    subnet?: string | Subnet
    ippool?: string | IPPool
    ipAddress?: string
    macAddress?: string
}

export const getSubnet = async (ns: NamespaceName, setSubnet?: React.Dispatch<React.SetStateAction<Subnet | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Subnet> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.get({
            resourceType: ResourceType.SUBNET,
            namespaceName: ns
        })
        const output = JSON.parse(result.response.data) as Subnet
        setSubnet?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get subnet [Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const listSubnets = async (setMultus: React.Dispatch<React.SetStateAction<Subnet[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Subnet[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.SUBNET,
            options: ListOptions.create(opts)
        })
        let items: Subnet[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as Subnet)
        })
        setMultus(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list subnet`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const listVirtualMachineNetwork = async (summary: VirtualMachineSummary, setVirtualMachineNetwork?: React.Dispatch<React.SetStateAction<VirtualMachineNetworkType[] | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineNetworkType[]> => {
    setLoading?.(true)
    try {
        const interfaces = summary.status?.virtualMachine?.spec?.template?.spec?.domain?.devices?.interfaces
        if (!interfaces) {
            setVirtualMachineNetwork?.(undefined)
            return []
        }

        const interfacesMap = new Map<string, any>(
            interfaces.map((item) => [item.name, item])
        )

        const ips = summary.status?.network?.ips
        const ipsMap = new Map<string, IP>(
            ips?.map((item) => {
                return [item.metadata!.name, item as IP]
            })
        )

        const subnets = await listSubnetByIPs(summary)
        const multusProviders = await listMultusProviderByNetwork(summary)

        const networks = summary.status?.virtualMachine?.spec?.template?.spec?.networks || []
        const data: (VirtualMachineNetworkType | null)[] = await Promise.all(networks.map(async (item) => {
            const inter = interfacesMap.get(item.name)
            if (!inter) {
                return null
            }

            let ipobj: IP | undefined = undefined
            let ippoolName: string = ""
            let multusNsKey = item.multus?.networkName || summary.status?.virtualMachine?.spec?.template?.metadata?.annotations?.[defaultNetworkAnno]
            if (multusNsKey) {
                let ipName = `${summary.metadata!.name}.${summary.metadata!.namespace}`
                const provider = multusProviders.get(multusNsKey)
                if (provider && provider.length > 0) {
                    ipName = `${ipName}.${provider}`
                }

                const temp = ipsMap.get(ipName)
                if (temp) {
                    ipobj = temp
                }
                const annoValue = summary.status?.virtualMachine?.spec?.template?.metadata?.annotations?.[generateKubeovnNetworkAnnon(multusNsKey, "ip_pool")]
                if (annoValue) {
                    ippoolName = annoValue
                }
            }

            let subnet: Subnet | undefined = undefined
            if (ipobj) {
                const name = ipobj.spec?.subnet
                if (name) {
                    subnet = subnets.get(name)
                }
            }

            const ds: VirtualMachineNetworkType = {
                name: item.name,
                default: item.pod ? true : item.multus?.default ? true : false,
                network: item.multus ? "multus" : "pod",
                interface: inter.bridge ? "bridge" : inter.masquerade ? "masquerade" : inter.sriov ? "sriov" : inter.slirp ? "slirp" : "",
                multus: parseNamespaceNameKey(multusNsKey),
                vpc: subnet?.spec?.vpc,
                subnet: ipobj?.spec?.subnet,
                ippool: ippoolName,
                ipAddress: ipobj?.spec?.ipAddress,
                macAddress: ipobj?.spec?.macAddress
            }
            return ds
        }))
        const output = data.filter((item): item is VirtualMachineNetworkType => item !== null)
        setVirtualMachineNetwork?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to list virtual machine network`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchSubnets = async (setSubnets: React.Dispatch<React.SetStateAction<Subnet[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, Subnet>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.SUBNET,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateSubnets = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setSubnets(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setSubnets(items.length > 0 ? items : undefined)
                    if (timeoutId !== null) {
                        clearTimeout(timeoutId)
                        timeoutId = null
                    }
                }
            }

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.READY: {
                        resolve()
                        break
                    }
                    case EventType.ADDED:
                    case EventType.MODIFIED: {
                        response.items.forEach((data) => {
                            const subnet = JSON.parse(data) as Subnet
                            map.set(namespaceNameKey(subnet), subnet)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const subnet = JSON.parse(data) as Subnet
                            map.delete(namespaceNameKey(subnet))
                        })
                        break
                    }
                }
                updateSubnets()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for Subnet: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch Subnet`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchSubnet = async (ns: NamespaceName, setSubnet: React.Dispatch<React.SetStateAction<Subnet | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.SUBNET,
                options: WatchOptions.create({
                    fieldSelectorGroup: {
                        operator: "&&",
                        fieldSelectors: [
                            { fieldPath: "metadata.name", operator: "=", values: [ns.name] }
                        ]
                    }
                })
            }, { abort: abortSignal })

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.READY: {
                        resolve()
                        break
                    }
                    case EventType.ADDED:
                    case EventType.MODIFIED: {
                        if (response.items.length === 0) {
                            return
                        }
                        setSubnet(JSON.parse(response.items[0]) as Subnet)
                        break
                    }
                    case EventType.DELETED: {
                        setSubnet(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for IPPool: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch IPPool`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const deleteSubnets = async (subnets: Subnet[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: Subnet[] = []
        const failed: { subnet: Subnet; error: any }[] = []

        await Promise.all(subnets.map(async (subnet) => {
            const name = subnet.metadata!.name!

            try {
                await resourceClient.delete({
                    namespaceName: { namespace: "", name: name },
                    resourceType: ResourceType.SUBNET
                }).response
                completed.push(subnet)
            } catch (err: any) {
                failed.push({ subnet, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ subnet, error }) => `Name: ${subnet.metadata!.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following subnets:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete subnets:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteSubnet = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.SUBNET,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete subnet [Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const createSubnet = async (subnet: Subnet, setSubnet?: React.Dispatch<React.SetStateAction<Subnet | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Subnet> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.SUBNET,
            data: JSON.stringify(subnet)
        })
        const output = JSON.parse(result.response.data) as Subnet
        setSubnet?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create subnet [Name: ${subnet.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const updateSubnet = async (subnet: Subnet, setSubnet?: React.Dispatch<React.SetStateAction<Subnet | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Subnet> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.SUBNET,
            data: JSON.stringify(subnet)
        })
        const temp = JSON.parse(result.response.data) as Subnet
        setSubnet?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update subnet [Name: ${subnet.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

const listMultusProviderByNetwork = async (summary: VirtualMachineSummary): Promise<Map<string, string>> => {
    const networks = summary.status?.virtualMachine?.spec?.template?.spec?.networks || []

    const multusNamesSet = new Set<string>()
    const multusNssSet = new Set<string>()

    for (const item of networks) {
        let multusNsKey = item.multus?.networkName || summary.status?.virtualMachine?.spec?.template?.metadata?.annotations?.[defaultNetworkAnno]
        if (!multusNsKey) {
            continue
        }
        const pares = parseNamespaceNameKey(multusNsKey)
        if (pares.namespace.length > 0) {
            multusNssSet.add(pares.namespace)
        }
        if (pares.name.length > 0) {
            multusNamesSet.add(pares.name)
        }
    }

    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.MULTUS,
            options: ListOptions.create({
                fieldSelectorGroup: {
                    operator: "&&",
                    fieldSelectors: [
                        {
                            fieldPath: "metadata.namespace",
                            operator: "~=",
                            values: Array.from(multusNssSet)
                        },
                        {
                            fieldPath: "metadata.name",
                            operator: "~=",
                            values: Array.from(multusNamesSet)
                        }
                    ]
                }
            })
        })

        const output = new Map<string, string>()
        result.response.items.forEach(item => {
            const m = JSON.parse(item) as Multus
            output.set(namespaceNameKey(m), getProvider(m))
        })
        return output
    } catch (err: any) {
        throw new Error(`Failed to list multus provider: ${err.message}`)
    }
}

const listSubnetByIPs = async (summary: VirtualMachineSummary): Promise<Map<string, Subnet>> => {
    const ips = summary.status?.network?.ips
    if (!ips) {
        return new Map<string, Subnet>()
    }

    const subnetNames: string[] = []
    ips.forEach(ip => {
        const subnet = ip.spec?.subnet
        if (subnet) {
            subnetNames.push(subnet)
        }
    })
    if (subnetNames.length === 0) {
        return new Map<string, Subnet>()
    }

    const subnets = new Map<string, Subnet>()
    try {
        const response = await resourceClient.list({
            resourceType: ResourceType.SUBNET,
            options: ListOptions.create({
                fieldSelectorGroup: {
                    operator: "&&",
                    fieldSelectors: [{ fieldPath: "metadata.name", operator: "~=", values: subnetNames }]
                }
            })
        })
        response.response.items.forEach((item) => {
            const subnet = JSON.parse(item) as Subnet
            subnets.set(subnet.metadata!.name!, subnet)
        })
        return subnets
    } catch (err: any) {
        throw new Error(`Failed to list subnets: ${err.message}`)
    }
}
