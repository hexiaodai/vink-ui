export interface Node {
    kind: string
    metadata: {
        name: string
        namespace?: string
        generateName?: string
        creationTimestamp?: string
        annotations?: {
            [key: string]: string
        }
    }
    spec?: {
    }
    status?: {
        addresses?: {
            address: string
            type: string
        }[]
        capacity?: {
            [key: string]: string
        }
        allocatable?: {
            [key: string]: string
        }
        conditions?: {
            status: string
            type: string
        }[]
    }
}
