import { Dropdown, MenuProps, Space } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { ActionType, ProTable } from '@ant-design/pro-components'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameKey } from '@/utils/k8s'
import { calcScroll, classNames } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { mergeFieldSelectors } from '@/utils/search'
import { FieldSelector } from '@/clients/ts/types/types'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'

interface CustomTableProps<T extends Record<string, any>> extends Partial<React.ComponentProps<typeof ProTable<T>>> {
    searchItems?: SearchItem[] | undefined
    storageKey?: string
    loading?: boolean
    defaultFieldSelectors?: FieldSelector[]
    onSelectRows?: (rows: T[]) => void
    updateWatchOptions?: React.Dispatch<React.SetStateAction<WatchOptions>>
}

export const CustomTable = <T extends Record<string, any>>({ searchItems, onSelectRows, storageKey, loading, defaultFieldSelectors, updateWatchOptions, ...proTableProps }: CustomTableProps<T>) => {
    const { namespace } = useNamespace()

    const searchRef = useRef<HTMLInputElement>()

    const actionRef = useRef<ActionType>()

    const firstRequestRef = useRef(true)

    const [scroll, setScroll] = useState(150 * (proTableProps.columns?.length || 0))

    const [searchOption, setSearchOption] = useState<SearchInputOption>({ fieldPath: "metadata.name", operator: "*=", label: "Name", open: false })

    const [searchText, setSearchText] = useState("")

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    useEffect(() => {
        const inputElement = document.querySelector('input[name="search"]')
        if (inputElement) {
            searchRef.current = inputElement as HTMLInputElement
        }
    }, [])

    return (
        <ProTable<T>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
            rowKey={(crd) => namespaceNameKey(crd)}
            rowSelection={{
                onChange: (_, selectedRows) => {
                    if (onSelectRows) {
                        onSelectRows(selectedRows)
                    }
                },
            }}
            tableAlertRender={({ selectedRowKeys, onCleanSelected }) => {
                return (
                    <Space size={16}>
                        <span>已选 {selectedRowKeys.length} 项</span>
                        <a onClick={onCleanSelected}>取消选择</a>
                    </Space>
                )
            }}
            actionRef={actionRef}
            scroll={{ x: scroll }}
            search={false}
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined /> }}
            columnsState={{
                persistenceKey: storageKey,
                persistenceType: 'localStorage',
                onChange: (obj) => setScroll(calcScroll(obj))
            }}
            request={async (params) => {
                const value = params.search || params.keyword
                if (((value && value.length > 0) || !firstRequestRef.current) && updateWatchOptions) {
                    updateWatchOptions((prevOpts) => {
                        const newFields: FieldSelector[] = []
                        const values = searchOption.values && searchOption.values?.length > 0 ? searchOption.values : [value]
                        if (values.length > 0 && values[0] && values[0].length > 0) {
                            newFields.push({
                                fieldPath: searchOption.fieldPath,
                                operator: searchOption.operator,
                                values: values
                            })
                        }
                        const updatedFieldSelectorGroup = mergeFieldSelectors(
                            newFields,
                            defaultFieldSelectors || []
                        )
                        return {
                            ...prevOpts,
                            fieldSelectorGroup: {
                                operator: "&&",
                                fieldSelectors: updatedFieldSelectorGroup
                            }
                        }
                    })
                }
                firstRequestRef.current = false
                return { success: true }
            }}
            options={{
                fullScreen: true,
                density: false,
                search: {
                    name: "search",
                    autoComplete: "off",
                    allowClear: true,
                    style: { width: 300 },
                    value: searchText,
                    placeholder: `Search by ${searchOption.label}`,
                    onClick: () => setSearchOption((pre) => ({ ...pre, open: true })),
                    onBlur: () => requestAnimationFrame(() => setSearchOption((pre) => ({ ...pre, open: false }))),
                    onKeyDown: (_e) => setSearchOption((pre) => ({ ...pre, open: false })),
                    onClear: () => setSearchText(""),
                    onChange: (e) => {
                        setSearchText(e.target.value)
                        setSearchOption(genenerateSearchInputOption(searchItems || [], searchOption.fieldPath, e.target.value))
                    },
                    prefix: <Dropdown
                        align={{ offset: [-11, 5] }}
                        open={searchOption.open}
                        menu={{
                            items: genenerateSearchMenus(searchItems || []),
                            onClick: (e) => {
                                searchOption.values = []
                                let fieldPath = e.key
                                let inputValue = ""
                                if (e.keyPath.length === 2) {
                                    fieldPath = e.keyPath[1]
                                    inputValue = e.keyPath[0]
                                }
                                if (inputValue.length > 0) {
                                    setSearchText(e.keyPath[0])
                                }
                                setSearchOption(genenerateSearchInputOption(searchItems || [], fieldPath, inputValue))
                                searchRef.current?.focus()
                            }
                        }}
                    >
                        <span>{searchOption.label}：</span>
                    </Dropdown>
                }
            }}
            pagination={false}
            {...proTableProps}
        />
    )
}

export interface SearchItem {
    fieldPath: string,
    name: string,
    operator?: string,
    items?: { inputValue: string, values: string[], operator: string }[]
}

interface SearchInputOption {
    fieldPath: string,
    operator: string,
    label: string,
    values?: string[],
    open: boolean
}

const genenerateSearchMenus = (opts: SearchItem[]) => {
    const searchOptions: MenuProps['items'] = opts.map(option => {
        if (option.items && option.items.length > 0) {
            return {
                key: option.fieldPath,
                label: option.name,
                children: option.items.map(item => ({
                    key: item.inputValue,
                    label: item.inputValue
                }))
            }
        }
        return {
            key: option.fieldPath,
            label: option.name
        }
    })

    return searchOptions
}

const genenerateSearchInputOption = (opts: SearchItem[], fieldPath: string, inputValue: string) => {
    const output: SearchInputOption = { fieldPath: fieldPath, operator: "", label: "", values: [inputValue], open: false }
    const option = opts.find(opt => opt.fieldPath === fieldPath)
    if (!option) {
        output.open = true
        return output
    }

    output.fieldPath = option.fieldPath
    output.label = option.name
    output.operator = option.operator || "*="

    if (!option.items || option.items.length === 0 || inputValue.length === 0) {
        return output
    }

    const item = option.items.find(it => it.inputValue === inputValue)
    if (!item) {
        return output
    }
    output.operator = item.operator
    output.values = item.values

    return output
}
