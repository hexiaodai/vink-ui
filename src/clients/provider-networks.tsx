export interface ProviderNetwork {
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
        defaultInterface?: string
        customInterfaces?: {
            interface: string
            nodes: string[]
        }[]
        excludeNodes?: string[]
    }
    status?: {
        conditions?: {
            status: string
            type: string
        }[]
    }
}
