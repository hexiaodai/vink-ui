export interface VLAN {
    apiVersion: string
    kind: string
    metadata: {
        name?: string
        namespace?: string
        creationTimestamp?: string
        annotations?: {
            [key: string]: string
        }
    }
    spec?: {
        id?: string
        provider?: string
    }
    status?: {
        conditions?: {
            status: string
            type: string
        }[]
    }
}
