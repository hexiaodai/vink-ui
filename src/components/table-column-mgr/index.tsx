import React, { useEffect, useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Drawer, Flex, Space, Table } from 'antd'
import { TableRowSelection } from 'antd/es/table/interface'
import { StoreColumn, TableColumnStore } from '@/components/table-column-mgr/store'
import type { ColumnsType } from 'antd/es/table'
import type { DragEndEvent } from '@dnd-kit/core'
import styles from '@/components/table-column-mgr/index.module.less'

interface TableColumnMrgProps {
    store: TableColumnStore
    open: boolean
    onSave: () => void
    onClose: () => void
}

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string
}

class TableColumnMrgHandler {
    private props: TableColumnMrgProps

    constructor(props: TableColumnMrgProps) {
        this.props = props
    }

    deepCopyData = () => {
        return JSON.parse(JSON.stringify(this.props.store.storeColumns()))
    }

    tableRow = (props: RowProps) => {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
            id: props['data-row-key']
        })

        const style: React.CSSProperties = {
            ...props.style,
            transform: CSS.Translate.toString(transform),
            transition,
            cursor: 'move',
            ...(isDragging ? { position: 'relative', zIndex: 9999 } : {})
        }

        return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
    }

    sensors = () => {
        return useSensors(
            useSensor(PointerSensor, {
                activationConstraint: {
                    distance: 1
                }
            })
        )
    }

    dragEnd = ({ active, over }: DragEndEvent, setDataSource: React.Dispatch<React.SetStateAction<StoreColumn[]>>) => {
        if (active.id !== over?.id) {
            setDataSource((prev) => {
                const activeIndex = prev.findIndex((i) => i.original.key === active.id)
                const overIndex = prev.findIndex((i) => i.original.key === over?.id)
                return arrayMove(prev, activeIndex, overIndex)
            })
        }
    }

    submit = (dataSource: StoreColumn[], selectedRows: string[]) => {
        dataSource.forEach(col => col.visible = selectedRows.includes(col.key))
        this.props.store.save(dataSource)

        this.props.onSave()
        this.props.onClose()
    }

    reset = (dataSource: StoreColumn[], setDataSource: React.Dispatch<React.SetStateAction<StoreColumn[]>>, setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>) => {
        setDataSource(this.deepCopyData())

        const newSelectedRows: string[] = []
        dataSource.forEach((col) => {
            if (col.visible) {
                newSelectedRows.push(col.key)
            }
        })
        setSelectedRows(newSelectedRows)
    }
}

const columns: ColumnsType<StoreColumn> = [
    {
        key: 'name',
        title: '列展示',
        ellipsis: true,
        render: (_, col) => <>{col.original.title}</>
    },
    // {
    //     key: 'width',
    //     title: '列宽',
    //     ellipsis: true,
    //     render: (_, col) => <>{col.original.width}</>
    //     // render: (_, col) => <>{col.original.width || 'auto'}</>
    // }
]

const TableColumnMgr: React.FC<TableColumnMrgProps> = ({ store, open, onClose, onSave }) => {
    const handler = new TableColumnMrgHandler({ store, open, onClose, onSave })

    const [dataSource, setDataSource] = useState(handler.deepCopyData())

    const [selectedRows, setSelectedRows] = useState<string[]>([])
    const rowSelection: TableRowSelection<any> = {
        selectedRowKeys: selectedRows,
        onChange: (keys: React.Key[]) => {
            setSelectedRows(keys as string[])
        }
    }

    useEffect(() => {
        handler.reset(dataSource, setDataSource, setSelectedRows)
    }, [open])

    return (
        <Drawer
            title="自定义列表项"
            open={open}
            onClose={onClose}
            closeIcon={false}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button type="primary" onClick={() => handler.submit(dataSource, selectedRows)}>确定</Button>
                        <Button onClick={onClose}>取消</Button>
                    </Space>
                    <Button type='text' onClick={() => handler.reset(dataSource, setDataSource, setSelectedRows)}>重置</Button>
                </Flex>
            }
        >
            <DndContext sensors={handler.sensors()} modifiers={[restrictToVerticalAxis]} onDragEnd={(e: DragEndEvent) => handler.dragEnd(e, setDataSource)}>
                <SortableContext
                    items={dataSource.map((i: StoreColumn) => i.key)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table
                        components={{
                            body: {
                                row: handler.tableRow
                            },
                        }}
                        size='small'
                        rowKey="key"
                        columns={columns}
                        dataSource={dataSource}
                        pagination={false}
                        rowSelection={rowSelection}
                        bordered={false}
                        className={styles["table-mgr"]}
                    />
                </SortableContext>
            </DndContext>
        </Drawer>
    )
}

export default TableColumnMgr