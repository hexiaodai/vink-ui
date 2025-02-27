import { App, Dropdown, MenuProps } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { ActionType, ProTable } from '@ant-design/pro-components'
import { useEffect, useRef, useState } from 'react'
import { namespaceNameString } from '@/utils/k8s'
import { calcScroll, classNames, filterNullish } from '@/utils/utils'
import { useNamespace } from '@/common/context'
import { WatchOptions } from '@/clients/ts/management/resource/v1alpha1/watch'
import { FieldSelector, ResourceType } from '@/clients/ts/types/types'
import { KubeResource, watch } from '@/clients/clients'
import { getNamespaceFieldSelector, mergeFieldSelectors } from '@/utils/search'
import tableStyles from '@/common/styles/table.module.less'
import commonStyles from '@/common/styles/common.module.less'
import useUnmount from '@/hooks/use-unmount'

interface ResourceTableProps<T extends Record<string, any>> extends Partial<React.ComponentProps<typeof ProTable<T>>> {
    tableKey: string
    resourceType: ResourceType
    searchOptions?: FieldSelectorOption[]
    defaultSelecoters?: FieldSelector[]
    converDataSourceFunc?: (data: T[] | undefined) => any
}

export interface FieldSelectorOption {
    fieldPath: string,
    label: string,
    operator: string,
    // jsonPath?: string,
    items?: { inputValue: string, values: string[], operator: string }[]
}

export interface InputOption {
    fieldPath: string,
    // jsonPath?: string,
    operator: string,
    label: string,
    values?: string[],
    open: boolean
}

const clusterResource = [ResourceType.NODE, ResourceType.NAMESPACE, ResourceType.PROVIDER_NETWORK, ResourceType.VLAN, ResourceType.VPC, ResourceType.SUBNET]

export const ResourceTable = <T extends KubeResource>({ tableKey, resourceType, searchOptions, defaultSelecoters, converDataSourceFunc, ...proTableProps }: ResourceTableProps<T>) => {
    const { namespace } = useNamespace()

    const { notification } = App.useApp()

    const searchRef = useRef<HTMLInputElement>()

    const actionRef = useRef<ActionType>()

    const firstRequestRef = useRef(true)

    const [scroll, setScroll] = useState(150 * (proTableProps.columns?.length || 0))

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<T[]>()

    const abortCtrl = useRef<AbortController>()

    const getDefaultSelecoters = () => {
        return clusterResource.includes(resourceType) ? defaultSelecoters : filterNullish([getNamespaceFieldSelector(namespace)].concat(defaultSelecoters))
    }

    const [opts, setOpts] = useState<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: getDefaultSelecoters() }
    }))

    if (!searchOptions) {
        searchOptions = [{ fieldPath: "metadata.name", label: "名称", operator: "*=" }]
    }

    const menus: MenuProps['items'] = searchOptions.map(option => {
        if (option.items && option.items.length > 0) {
            return {
                key: option.fieldPath,
                label: option.label,
                children: option.items.map(item => ({
                    key: item.inputValue,
                    label: item.inputValue
                }))
            }
        }
        return { key: option.fieldPath, label: option.label }
    })

    useEffect(() => {
        actionRef.current?.reload()
    }, [namespace])

    useEffect(() => {
        const inputElement = document.querySelector(`input[name="${tableKey}"]`)
        if (inputElement) {
            searchRef.current = inputElement as HTMLInputElement
        }
    }, [])

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watch<T>(resourceType, setResources, abortCtrl.current.signal, opts, setLoading, notification)
    }, [opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const genenerateInputOption = (fieldPath?: string, inputValue?: string) => {
        const newInputOption: InputOption = { open: false, fieldPath: "", operator: "", label: "" }
        if (searchOptions.length === 0 || !fieldPath) {
            return newInputOption
        }
        const selected = searchOptions.find(opt => opt.fieldPath === fieldPath)
        if (!selected) {
            return newInputOption
        }

        newInputOption.fieldPath = selected.fieldPath
        newInputOption.operator = selected.operator
        newInputOption.label = selected.label
        // newInputOption.jsonPath = selected.jsonPath

        if (inputValue) {
            newInputOption.values = [inputValue]
        }

        const item = selected.items?.find(it => it.inputValue === inputValue)
        if (item) {
            newInputOption.operator = item.operator
            newInputOption.values = item.values
        }
        return newInputOption
    }

    const [inputOption, setInputOption] = useState<InputOption>(genenerateInputOption(searchOptions?.[0]?.fieldPath))

    return (
        <ProTable<T>
            className={classNames(tableStyles["table-padding"], commonStyles["small-scrollbar"])}
            rowKey={(cr) => namespaceNameString(cr)}
            actionRef={actionRef}
            scroll={{ x: scroll }}
            search={false}
            loading={{ spinning: loading, delay: 500, indicator: <LoadingOutlined /> }}
            dataSource={converDataSourceFunc ? converDataSourceFunc(resources) : resources}
            columnsState={{
                persistenceKey: tableKey,
                persistenceType: 'localStorage',
                onChange: (obj) => setScroll(calcScroll(obj))
            }}
            request={async (params) => {
                const searchValue = params.search || params.keyword
                if (((searchValue && searchValue.length > 0) || !firstRequestRef.current)) {
                    setOpts((prevOpts) => {
                        let newFields: FieldSelector[] = []
                        if (inputOption.fieldPath.length > 0) {
                            const values = inputOption.values && inputOption.values.length > 0 ? inputOption.values : [searchValue]
                            if (values.length > 0 && values[0] && values[0].length > 0) {
                                newFields.push(FieldSelector.create({ fieldPath: inputOption.fieldPath, operator: inputOption.operator, values: values }))
                                // newFields.push({ fieldPath: inputOption.fieldPath, jsonPath: inputOption.jsonPath ?? "", operator: inputOption.operator, values: values })
                            }
                        }
                        const selecoters = getDefaultSelecoters()
                        if (selecoters) {
                            newFields = mergeFieldSelectors(newFields, selecoters)
                        }
                        return {
                            ...prevOpts,
                            fieldSelectorGroup: { operator: "&&", fieldSelectors: newFields }
                        }
                    })
                }
                firstRequestRef.current = false
                return { success: true }
            }}
            options={{
                fullScreen: false,
                density: false,
                search: (searchOptions.length > 0) ? {
                    name: tableKey,
                    autoComplete: "off",
                    allowClear: true,
                    style: { width: 300 },
                    value: inputOption?.values?.[0],
                    onClick: () => setInputOption((pre) => ({ ...pre, open: true })),
                    onBlur: () => requestAnimationFrame(() => setInputOption((pre) => ({ ...pre, open: false }))),
                    onKeyDown: (_e) => setInputOption((pre) => ({ ...pre, open: false })),
                    onClear: () => setInputOption((pre) => ({ ...pre, values: undefined })),
                    onChange: (e) => {
                        const newInputOpt = genenerateInputOption(inputOption.fieldPath, e.target.value)
                        if (newInputOpt) {
                            setInputOption(newInputOpt)
                        }
                    },
                    prefix: <Dropdown
                        align={{ offset: [-11, 5] }}
                        open={searchOptions.length > 1 && inputOption.open}
                        menu={{
                            items: menus,
                            onClick: (e) => {
                                let fieldPath = e.key
                                let inputValue = ""
                                if (e.keyPath.length >= 2) {
                                    fieldPath = e.keyPath[1]
                                    inputValue = e.keyPath[0]
                                }

                                const newInputOpt = genenerateInputOption(fieldPath, inputValue)
                                if (newInputOpt) {
                                    setInputOption(newInputOpt)
                                }
                                searchRef.current?.focus()
                            }
                        }}
                    >
                        <span>{(inputOption.label && inputOption.label.length > 0) ? `${inputOption.label}：` : ""}</span>
                    </Dropdown>
                } : false
            }}
            pagination={false}
            {...proTableProps}
        />
    )
}
