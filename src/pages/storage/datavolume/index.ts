import { instances as labels } from "@/clients/ts/label/labels.gen"
import { NamespaceName } from '@/clients/ts/types/types'
import { DataVolume } from '@/clients/data-volume'

const defaultAccessMode = "ReadWriteOnce"

const defaultStorageClass = "local-path"

const getProtocol = (url: string): string | null => {
    const protocolRegex = /^(https?|docker|s3):\/\//
    const match = url.match(protocolRegex)
    return match ? match[1] : null
}

export const newSystemImage = (ns: NamespaceName, imageSource: string, imageCapacity: number, family: string, version: string) => {
    const instance: DataVolume = {
        apiVersion: "cdi.kubevirt.io/v1beta1",
        kind: "DataVolume",
        metadata: {
            name: ns.name,
            namespace: ns.namespace,
            labels: {
                [labels.VinkDatavolumeType.name]: "image",
                [labels.VinkOperatingSystem.name]: family,
                [labels.VinkOperatingSystemVersion.name]: version
            },
            annotations: {
                "cdi.kubevirt.io/storage.bind.immediate.requested": "true"
            }
        },
        spec: {
            pvc: {
                accessModes: ["ReadWriteOnce"],
                resources: {
                    requests: {
                        storage: `${imageCapacity}Gi`
                    }
                },
                storageClassName: "local-path"
            },
            source: {}
        }
    }

    switch (getProtocol(imageSource)) {
        case "docker":
            instance.spec.source = { registry: { url: imageSource } }
            break
        case "s3":
            instance.spec.source = { s3: { url: imageSource } }
            break
        case "http":
        case "https":
            instance.spec.source = { http: { url: imageSource } }
            break
    }

    return instance
}

export const newDataDisk = (ns: NamespaceName, diskCapacity: number, storageClass?: string, accessMode?: string) => {
    const instance: DataVolume = {
        apiVersion: "cdi.kubevirt.io/v1beta1",
        kind: "DataVolume",
        metadata: {
            name: ns.name,
            namespace: ns.namespace,
            labels: {
                [labels.VinkDatavolumeType.name]: "data"
            },
            annotations: {
                "cdi.kubevirt.io/storage.bind.immediate.requested": "true"
            }
        },
        spec: {
            pvc: {
                accessModes: [(accessMode && accessMode.length > 0) ? accessMode : defaultAccessMode],
                resources: {
                    requests: {
                        storage: `${diskCapacity}Gi`
                    }
                },
                storageClassName: (storageClass && storageClass.length > 0) ? storageClass : defaultStorageClass
            },
            source: { blank: {} }
        }
    }

    return instance
}
