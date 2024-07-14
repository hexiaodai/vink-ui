import { TableProps } from "antd"
import { ColumnType } from "antd/es/table"

export interface StoreColumn {
    key: string
    visible: boolean
    original: ColumnType<any>
}

export class TableColumnStore {
    private persistentStorageKey: string
    private data: StoreColumn[] = []

    constructor(persistentStorageKey: string, columns: TableProps<any>['columns']) {
        this.persistentStorageKey = persistentStorageKey

        let store: StoreColumn[] = []
        const serializedValue = window.localStorage.getItem(this.persistentStorageKey)
        if (serializedValue != null && serializedValue != "undefined") {
            store = JSON.parse(serializedValue) as StoreColumn[]
        }

        const colIdx = new Map<string, ColumnType<any>>()
        columns?.forEach(column => {
            colIdx.set(column.key as string, column)
        })
        const storeIdx = new Map<string, StoreColumn>()
        store?.forEach(column => {
            storeIdx.set(column.original.key as string, column)
        })

        const data: StoreColumn[] = []

        store.forEach(column => {
            const temp = colIdx.get(column.key as string)
            if (temp != null) {
                data.push({
                    key: column.key,
                    visible: column.visible,
                    original: temp
                })
            }
        })

        columns?.forEach(column => {
            const temp = storeIdx.get(column.key as string)
            if (temp == null) {
                data.push({
                    key: column.key as string,
                    visible: true,
                    original: column
                })
            }
        })

        this.data = data

        window.localStorage.setItem(this.persistentStorageKey, JSON.stringify(this.data))
    }

    storeColumns = () => {
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

    save = (sc: StoreColumn[]) => {
        const idx = new Map<string, StoreColumn>()
        this.data?.forEach(column => {
            idx.set(column.key, column)
        })

        const newData: StoreColumn[] = []
        sc.forEach(column => {
            const temp = idx.get(column.key)
            if (temp != null) {
                newData.push({
                    key: column.key,
                    visible: column.visible,
                    original: temp.original
                })
            }
        })

        this.data = newData
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


