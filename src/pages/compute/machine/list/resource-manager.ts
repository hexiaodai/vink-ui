import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { NamespaceName } from "@/apis/types/namespace_name"
import { clients } from "@/resource-manager/clients"
import { namespaceName } from "@/utils/k8s"
import { allowedError, jsonParse } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"

export class ResourceUpdater {
    virtualMachine: Map<string, CustomResourceDefinition>
    setVirtualMachine: any

    virtualMachineInstance: Map<string, CustomResourceDefinition>
    setVirtualMachineInstance: any

    rootDisk: Map<string, CustomResourceDefinition>
    setRootDisk: any

    node: Map<string, CustomResourceDefinition>
    setNode: any

    abortCtrl!: AbortController
    notification: NotificationInstance

    constructor(
        virtualMachine: Map<string, CustomResourceDefinition>,
        setVirtualMachine: any,
        virtualMachineInstance: Map<string, CustomResourceDefinition>,
        setVirtualMachineInstance: any,
        rootDisk: Map<string, CustomResourceDefinition>,
        setRootDisk: any,
        node: Map<string, CustomResourceDefinition>,
        setNode: any,
        notification: NotificationInstance
    ) {
        this.virtualMachine = virtualMachine
        this.setVirtualMachine = setVirtualMachine
        this.virtualMachineInstance = virtualMachineInstance
        this.setVirtualMachineInstance = setVirtualMachineInstance
        this.rootDisk = rootDisk
        this.setRootDisk = setRootDisk
        this.node = node
        this.setNode = setNode
        this.notification = notification
    }

    async updateResource(advancedParams: any, abortCtrl: AbortController): Promise<void> {
        this.abortCtrl = abortCtrl

        return new Promise((resolve, reject) => {
            const call = clients.resourceWatch.listWatch(
                {
                    groupVersionResource: {
                        option: {
                            oneofKind: "enum",
                            enum: GroupVersionResourceEnum.VIRTUAL_MACHINE
                        }
                    },
                    options: {
                        fieldSelector: this.generateSelecter(advancedParams),
                        labelSelector: "",
                        limit: 0,
                        continue: "",
                        namespaceNames: [],
                        namespace: advancedParams.namespace,
                        watch: true
                    }
                },
                { abort: this.abortCtrl.signal }
            )

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.ADDED: {
                        const temp = new Map<string, CustomResourceDefinition>()
                        response.items.forEach((vm) => {
                            temp.set(namespaceName(vm.metadata), vm)
                        })
                        this.virtualMachine = temp
                        this.setVirtualMachine(temp)
                        this.updateVirtualMachineInstances(response.eventType, temp)
                        this.updateDataVolumes(response.eventType, temp)
                        break
                    }
                    case EventType.MODIFIED: {
                        const temp = new Map<string, CustomResourceDefinition>()
                        response.items.forEach((vm) => {
                            temp.set(namespaceName(vm.metadata), vm)
                            this.virtualMachine.set(namespaceName(vm.metadata), vm)
                        })
                        this.setVirtualMachine(new Map(this.virtualMachine))
                        this.updateVirtualMachineInstances(response.eventType, temp)
                        this.updateDataVolumes(response.eventType, temp)
                        break
                    }
                    case EventType.DELETED: {
                        const key = `${response.deleted?.namespace}/${response.deleted?.name}`
                        this.virtualMachine.delete(key)
                        this.virtualMachineInstance.delete(key)
                        this.rootDisk.delete(key)
                        this.setVirtualMachine(new Map(this.virtualMachine))
                        this.setVirtualMachineInstance(new Map(this.virtualMachineInstance))
                        this.setRootDisk(new Map(this.rootDisk))
                        break
                    }
                }
                resolve()
            })

            call.responses.onError((err: Error) => {
                // alert(err)
                if (!allowedError(err)) {
                    this.notification.error({
                        message: "VirtualMachine",
                        description: err.message
                    })
                }
                reject(err.message)
            })
        })
    }

    private updateVirtualMachineInstances(eventType: EventType, vms: Map<string, CustomResourceDefinition>) {
        const ns: NamespaceName[] = []
        vms.forEach(vm => {
            ns.push({ namespace: vm.metadata?.namespace!, name: vm.metadata?.name! })
        })

        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VIRTUAL_MACHINE_INSTANCE
                }
            },
            options: {
                fieldSelector: "",
                labelSelector: "",
                limit: 0,
                continue: "",
                namespaceNames: ns,
                namespace: "",
                watch: false,
            }
        },
            { abort: this.abortCtrl.signal }
        )

        call.responses.onMessage((response) => {
            const temp = new Map<string, CustomResourceDefinition>()
            response.items.forEach((item) => {
                temp.set(namespaceName(item.metadata), item)
            })

            ns.forEach(n => {
                this.virtualMachineInstance.delete(`${n.namespace}/${n.name}`)
            })

            switch (eventType) {
                case EventType.ADDED: {
                    this.virtualMachineInstance = temp
                    this.setVirtualMachineInstance(temp)
                    break
                }
                case EventType.MODIFIED: {
                    temp.forEach((vmi, key) => {
                        this.virtualMachineInstance.set(key, vmi)
                    })
                    this.setVirtualMachineInstance(new Map(this.virtualMachineInstance))
                }
            }

            this.updateNodes(eventType, temp)
            return
        })

        call.responses.onError((err: Error) => {
            // alert(err)
            if (!allowedError(err)) {
                this.notification.error({ message: "VirtualMachineInstance", description: err.message })
            }
        })
    }

    private updateDataVolumes(eventType: EventType, vms: Map<string, CustomResourceDefinition>) {
        const ns: NamespaceName[] = []
        const vmvolmap = new Map<string, string>()
        vms.forEach(vm => {
            const spec = jsonParse(vm.spec)
            spec.template?.spec?.volumes?.forEach((volume: any) => {
                let rootDiskName = ""
                const disks = spec.template?.spec?.domain?.devices?.disks

                for (const disk of disks) {
                    if (disk.bootOrder == 1) {
                        rootDiskName = disk.name
                        break
                    }
                }
                if (rootDiskName.length == 0) {
                    rootDiskName = disks[0]?.name
                }

                if (volume.dataVolume && volume.name == rootDiskName) {
                    const dvns = { namespace: vm.metadata?.namespace!, name: volume.dataVolume.name }
                    vmvolmap.set(`${vm.metadata?.namespace!}/${vm.metadata?.name!}`, `${vm.metadata?.namespace!}/${volume.dataVolume.name}`)
                    ns.push(dvns)
                }
            })
        })

        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.DATA_VOLUME
                }
            },
            options: {
                fieldSelector: "",
                labelSelector: "",
                limit: 0,
                continue: "",
                namespaceNames: ns,
                namespace: "",
                watch: false,
            }
        },
            { abort: this.abortCtrl.signal }
        )

        call.responses.onMessage((response) => {
            const dvmap = new Map<string, CustomResourceDefinition>()
            response.items.forEach((item) => {
                dvmap.set(namespaceName(item.metadata), item)
            })

            const vmrootdiskmap = new Map<string, CustomResourceDefinition>()
            vms.forEach(vm => {
                const vmkey = namespaceName(vm.metadata)
                const dvkey = vmvolmap.get(vmkey)
                if (dvkey) {
                    const rootdv = dvmap.get(dvkey)
                    if (rootdv) {
                        vmrootdiskmap.set(vmkey, rootdv)
                    }
                }
            })

            switch (eventType) {
                case EventType.ADDED: {
                    this.rootDisk = vmrootdiskmap
                    this.setRootDisk(vmrootdiskmap)
                    break
                }
                case EventType.MODIFIED: {
                    vmrootdiskmap.forEach((dv, key) => {
                        this.rootDisk.set(key, dv)
                    })
                    this.setRootDisk(new Map(this.rootDisk))
                }
            }
        })
        call.responses.onError((err: Error) => {
            // alert(err)
            if (!allowedError(err)) {
                this.notification.error({ message: "DataVolume", description: err.message })
            }
        })
    }

    private updateNodes = (eventType: EventType, vmis: Map<string, CustomResourceDefinition>) => {
        const ns: NamespaceName[] = []
        vmis.forEach(vmi => {
            const status = jsonParse(vmi.status)
            if (status.nodeName && !this.node.has(status.nodeName)) {
                ns.push({ namespace: "", name: status.nodeName })
            }
        })
        if (ns.length == 0) {
            return
        }

        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.NODE
                }
            },
            options: {
                fieldSelector: "",
                labelSelector: "",
                limit: 0,
                continue: "",
                namespaceNames: ns,
                namespace: "",
                watch: false,
            }
        },
            { abort: this.abortCtrl.signal }
        )

        call.responses.onMessage((response) => {
            const hostmap = new Map<string, CustomResourceDefinition>()
            response.items.forEach((item) => {
                hostmap.set(item.metadata?.name!, item)
            })

            switch (eventType) {
                case EventType.ADDED: {
                    this.setNode(hostmap)
                    break
                }
                case EventType.MODIFIED: {
                    hostmap.forEach((item, key) => {
                        this.node.set(key, item)
                    })
                    this.setNode(new Map(this.node))
                }
            }
        })
        call.responses.onError((err: Error) => {
            // alert(err)
            if (!allowedError(err)) {
                this.notification.error({ message: "Node", description: err.message })
            }
        })
    }

    generateSelecter = (advancedParams: any) => {
        return advancedParams.params.keyword ? `metadata.${advancedParams.searchFilter}=${advancedParams.params.keyword}` : ""
    }
}
