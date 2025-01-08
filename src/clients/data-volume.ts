import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { isAbortedError } from "@/utils/utils"
import { VirtualMachine } from "./virtual-machine"

export type DataVolume = components["schemas"]["v1beta1DataVolume"]

export const getDataVolume = async (ns: NamespaceName): Promise<DataVolume> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.get({
            resourceType: ResourceType.DATA_VOLUME,
            namespaceName: ns
        })
        call.then((result) => {
            resolve(JSON.parse(result.response.data) as DataVolume)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to get data volume [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
        })
    })
}

export const listDataVolumes = async (opts?: ListOptions): Promise<DataVolume[]> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.list({
            resourceType: ResourceType.DATA_VOLUME,
            options: ListOptions.create(opts)
        })
        call.then((result) => {
            let items: DataVolume[] = []
            result.response.items.forEach((item: string) => {
                items.push(JSON.parse(item) as DataVolume)
            })
            resolve(items)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to list data volume: ${err.message}`))
        })
    })
}

export const watchDataVolumes = (setDataVolumes: React.Dispatch<React.SetStateAction<DataVolume[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        setLoading(true)

        const map = new Map<string, DataVolume>()

        const call = resourceWatchClient.watch({
            resourceType: ResourceType.DATA_VOLUME,
            options: WatchOptions.create(opts)
        }, { abort: abortSignal })

        let timeoutId: NodeJS.Timeout | null = null
        const updateVirtualMachineSummarys = () => {
            if (map.size === 0 && timeoutId === null) {
                timeoutId = setTimeout(() => {
                    const items = Array.from(map.values())
                    setDataVolumes(items.length > 0 ? items : undefined)
                    timeoutId = null
                }, defaultTimeout)
            } else {
                const items = Array.from(map.values())
                setDataVolumes(items.length > 0 ? items : undefined)
                if (timeoutId !== null) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }
        }

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.READY: {
                    setLoading(false)
                    break
                }
                case EventType.ADDED:
                case EventType.MODIFIED: {
                    response.items.forEach((data) => {
                        const vm = JSON.parse(data) as DataVolume
                        map.set(namespaceNameKey(vm), vm)
                    })
                    break
                }
                case EventType.DELETED: {
                    response.items.forEach((data) => {
                        const vm = JSON.parse(data) as DataVolume
                        map.delete(namespaceNameKey(vm))
                    })
                    break
                }
            }
            updateVirtualMachineSummarys()
        })

        call.responses.onError((err: Error) => {
            setLoading(false)
            if (isAbortedError(err)) {
                resolve()
            } else {
                reject(new Error(`Error in watch stream for DataVolume: ${err.message}`))
            }
        })

        call.responses.onComplete(() => {
            setLoading(false)
            resolve()
        })
    })
}

export const getRootDisk = (setLoading: React.Dispatch<React.SetStateAction<boolean>>, vm: VirtualMachine): Promise<DataVolume> => {
    return new Promise((resolve, reject) => {
        const disks = vm.spec?.template?.spec?.domain?.devices?.disks
        if (!disks || disks.length === 0) {
            setLoading(false)
            reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No disks found`))
            return
        }

        let disk = disks.find((disk: any) => {
            return disk.bootOrder === 1
        })
        if (!disk) {
            disk = disks[0]
        }

        const volumes = vm.spec?.template?.spec?.volumes
        if (!volumes || volumes.length === 0) {
            setLoading(false)
            reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volumes found`))
            return
        }

        const vol = volumes.find((vol: any) => {
            return vol.name == disk.name
        })
        if (!vol) {
            setLoading(false)
            reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volume found`))
            return
        }
        getDataVolume({ namespace: vm.metadata!.namespace, name: vol.dataVolume!.name }).then(dv => {
            resolve(dv)
        }).catch(err => {
            reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: ${err.message}`))
        }).finally(() => {
            setLoading(false)
        })
    })
}
