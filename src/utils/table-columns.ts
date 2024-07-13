import { TableProps } from "antd";
import { ColumnGroupType, ColumnType } from "antd/es/table";

export interface Column {
    visible: boolean
    data: ColumnGroupType<any> | ColumnType<any>
}

export class TableColumns {
    private key: string = ""
    private data: Column[] = []

    constructor(key: string, columns: TableProps<any>['columns']) {
        this.key = key

        let store: Column[] = []
        const serializedValue = window.localStorage.getItem(this.key)
        if (serializedValue != null && serializedValue != "undefined") {
            store = JSON.parse(serializedValue) as Column[]
        }

        const storeIdx = new Map<string, Column>()
        store?.forEach(column => {
            storeIdx.set(column.data.key as string, column)
        })

        columns?.forEach(column => {
            let visible = true
            const temp = storeIdx.get(column.key as string)
            if (temp != null) {
                visible = temp.visible
            }
            this.data.push({
                visible: visible,
                data: column
            })
        })

        window.localStorage.setItem(this.key, JSON.stringify(this.data))
    }

    columns = () => {
        return this.data
    }

    visibleColumns = () => {
        const columns: TableProps<any>['columns'] = []
        this.data?.forEach(column => {
            if (column.visible) {
                columns.push(column.data)
            }
        })
        return columns
    }

    reset = (columns: Column[]) => {
        this.data = columns
        window.localStorage.setItem(this.key, JSON.stringify(this.data))
    }

    setNotVisible = (key: string) => {
        this.data.forEach(column => {
            if (column.data.key === key) {
                column.visible = false
            }
        })
        window.localStorage.setItem(this.key, JSON.stringify(this.data))
    }

    setVisible = (key: string) => {
        this.data.forEach(column => {
            if (column.data.key === key) {
                column.visible = true
            }
        })
        window.localStorage.setItem(this.key, JSON.stringify(this.data))
    }
}


