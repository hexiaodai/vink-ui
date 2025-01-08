import { namespaceNameKey } from "@/utils/k8s"
import { resourceClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { FieldSelector, ResourceType } from "./ts/types/types"
import { VirtualMachineSummary } from "./virtual-machine-summary"
import { IP } from "./ip"
import { defaultNetworkAnno } from "@/pages/compute/machine/virtualmachine"
import { generateKubeovnNetworkAnnon } from "@/utils/utils"

export type Subnet = components["schemas"]["v1Subnet"]

export type VirtualMachineNetworkDataSourceType = {
    name: string
    default: boolean
    network: string
    interface: string
    multus: string
    vpc: string
    subnet: string
    ippool: string
    ipAddress: string
    macAddress: string
}

export const listSubnetsForVirtualMachine = async (summary: VirtualMachineSummary): Promise<VirtualMachineNetworkDataSourceType[]> => {
    return new Promise(async (resolve, reject) => {
        const interfaces = summary.status?.virtualMachine?.spec?.template?.spec?.domain?.devices?.interfaces
        if (!interfaces) {
            resolve([])
            return
        }

        const interfacesMap = new Map<string, any>(
            interfaces.map((item: any) => [item.name, item])
        )

        const ips = summary.status?.network?.ips
        const ipsMap = new Map<string, IP>(
            ips?.map((item) => {
                const arr = (item.metadata!.name as string).split(".")
                if (arr && arr.length >= 3) {
                    return [`${arr[1]}/${arr[2]}`, item]
                }
                return [namespaceNameKey(item), item as IP]
            })
        )

        const subnetSelectors: FieldSelector[] = []
        ipsMap.forEach(ip => {
            const subnet = ip.spec?.subnet
            if (subnet) {
                subnetSelectors.push({ fieldPath: "metadata.name", operator: "=", values: [subnet] })
            }
        })

        const subnetMap = new Map<string, Subnet>()

        try {
            const response = await resourceClient.list({
                resourceType: ResourceType.SUBNET,
                options: ListOptions.create({ fieldSelectorGroup: { operator: "||", fieldSelectors: subnetSelectors } })
            })
            response.response.items.forEach((item) => {
                const subnet = JSON.parse(item) as Subnet
                subnetMap.set(subnet.metadata!.name!, subnet)
            })
        } catch (err: any) {
            return reject(new Error(`Failed to list subnets: ${err.message}`))
        }

        const networks = summary.status?.virtualMachine?.spec?.template?.spec?.networks || []
        const data: (VirtualMachineNetworkDataSourceType | null)[] = await Promise.all(networks.map(async (item) => {
            const inter = interfacesMap.get(item.name)
            if (!inter) {
                return null
            }

            let ipobj: IP | undefined = undefined
            let ippoolName: string = ""
            let multus = item.multus?.networkName || summary.status?.virtualMachine?.spec?.template?.metadata?.annotations?.[defaultNetworkAnno]
            if (multus) {
                const temp = ipsMap.get(multus)
                if (temp) {
                    ipobj = temp
                }
                const annoValue = summary.status?.virtualMachine?.spec?.template?.metadata?.annotations?.[generateKubeovnNetworkAnnon(multus, "ip_pool")]
                if (annoValue) {
                    ippoolName = annoValue
                }
            }

            let subnet: Subnet | undefined = undefined
            if (ipobj) {
                const name = ipobj.spec?.subnet
                if (name) {
                    subnet = subnetMap.get(name)
                }
            }

            const ds: VirtualMachineNetworkDataSourceType = {
                name: item.name,
                default: item.pod ? true : item.multus?.default ? true : false,
                network: item.multus ? "multus" : "pod",
                interface: inter.bridge ? "bridge" : inter.masquerade ? "masquerade" : inter.sriov ? "sriov" : inter.slirp ? "slirp" : "",
                multus: multus || "",
                vpc: subnet?.spec?.vpc || "",
                subnet: ipobj?.spec?.subnet || "",
                ippool: ippoolName,
                ipAddress: ipobj?.spec?.ipAddress || "",
                macAddress: ipobj?.spec?.macAddress || ""
            }
            return ds
        }))

        return resolve(data.filter((item): item is VirtualMachineNetworkDataSourceType => item !== null))
    })
}
