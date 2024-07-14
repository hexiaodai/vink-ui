import { TableProps } from "antd";
import { ColumnType } from "antd/es/table"

export interface StoreColumn {
    visible: boolean
    original: ColumnType<any>
}

export class TableColumns {
    private persistentStorageKey: string
    private data: StoreColumn[] = []

    constructor(persistentStorageKey: string, columns: TableProps<any>['columns']) {
        this.persistentStorageKey = persistentStorageKey

        let store: StoreColumn[] = []
        const serializedValue = window.localStorage.getItem(this.persistentStorageKey)
        if (serializedValue != null && serializedValue != "undefined") {
            store = JSON.parse(serializedValue) as StoreColumn[]
        }

        const storeIdx = this.generateStoreIdx(store)

        columns?.forEach(column => {
            let visible = true
            const temp = storeIdx.get(column.key as string)
            if (temp != null) {
                visible = temp.visible
            }
            this.data.push({
                visible: visible,
                original: column
            })
        })

        window.localStorage.setItem(this.persistentStorageKey, JSON.stringify(this.data))
    }

    private generateStoreIdx = (store: StoreColumn[]) => {
        const storeIdx = new Map<string, StoreColumn>()
        store?.forEach(column => {
            storeIdx.set(column.original.key as string, column)
        })
        return storeIdx
    }

    columns = () => {
        return this.data
    }

    visibleColumns = () => {
        const columns: TableProps<any>['columns'] = []
        this.data?.forEach(column => {
            if (column.visible) {
                columns.push(column.original)
            }
        })
        return columns
    }

    reset = async (columns: StoreColumn[]) => {
        const storeIdx = this.generateStoreIdx(columns)

        this.data.forEach(column => {
            const temp = storeIdx.get(column.original.key as string)
            if (temp != null) {
                column.visible = temp.visible
            }
        })

        window.localStorage.setItem(this.persistentStorageKey, JSON.stringify(this.data))
    }

    setNotVisible = (key: string) => {
        this.data.forEach(column => {
            if (column.original.key === key) {
                column.visible = false
            }
        })
        window.localStorage.setItem(this.persistentStorageKey, JSON.stringify(this.data))
    }

    setVisible = (key: string) => {
        this.data.forEach(column => {
            if (column.original.key === key) {
                column.visible = true
            }
        })
        window.localStorage.setItem(this.persistentStorageKey, JSON.stringify(this.data))
    }
}


