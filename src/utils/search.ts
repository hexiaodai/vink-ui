// import { osFamilyLabel, diskTypeLabel } from '@/utils/k8s.ts'
import { instances } from "@/clients/ts/label/labels.gen.ts"
import { FieldSelector, FieldSelectorGroup } from "@/clients/ts/types/types"

export type Filter = {
    key: string
    operator: string
    value: string
}

export const LabelsSelector = (filters: Filter[]): string => {
    const labels = filters.map((filter) => {
        return `${filter.key}${filter.operator}${filter.value}`
    })
    return labels.join(',')
}

export const LabelsSelectorString = (filters: string[]): string => {
    const labels = filters.map((filter) => {
        return `${filter}`
    })
    return labels.join(',')
}

export const FieldSelector = (filter: Filter): string => {
    return `${filter.key}${filter.operator}${filter.value}`
}

export const NameFieldSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return FieldSelector({
        key: 'metadata.name',
        operator: '=',
        value: name
    })
}

export const virtualMachineOSLabelSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: instances.VinkVirtualmachineOs.name,
        operator: '=',
        value: name
    }])
}

export const dataVolumeTypeLabelSelector = (name: string) => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: instances.VinkDatavolumeType.name,
        operator: '=',
        value: name
    }])
}

export const fieldSelector = (params: { keyword?: string }) => {
    return (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : ""
}

export const simpleFieldSelector2 = (params?: { namespace?: string, keyword?: string }) => {
    if (!params) {
        return []
    }
    let selector: string[] = []
    if (params.namespace && params.namespace.length > 0) {
        selector.push(`metadata.namespace=${params.namespace}`)
    }
    if (params.keyword && params.keyword.length > 0) {
        selector.push(`status.virtualMachine.status.printableStatus*=${params.keyword}`)
        // selector.push(`metadata.name*=${params.keyword}`)
    }
    if (selector.length == 0) {
        return []
    }
    return [selector.join(",")]
}

export interface fieldSelector {
    fieldPath: string
    values: string[]
    operator: string
}

// export const mergeFieldSelectors = (newFields: fieldSelector[], group?: FieldSelectorGroup) => {
//     if (!group) {
//         group = {
//             fieldSelectors: [],
//             operator: "&&"
//         }
//     }

//     const fieldMap = new Map(group.fieldSelectors.map(field => [field.fieldPath, field]))

//     for (const field of newFields) {
//         fieldMap.set(field.fieldPath, field)
//     }

//     console.log("fieldMap.values()", fieldMap.values())
//     group.fieldSelectors = Array.from(fieldMap.values()).filter(
//         field => field.fieldPath && field.values && field.values.length > 0 && (field.values[0] !== undefined || field.values[0] !== null)
//         // field => field.fieldPath && field.values && field.values.length > 0 && field.values[0] && field.values[0].length > 0
//     )

//     return group
// }


export const mergeFieldSelectors = (newFields: fieldSelector[], oldFields: fieldSelector[]) => {
    // if (!group) {
    //     group = {
    //         fieldSelectors: [],
    //         operator: "&&"
    //     }
    // }

    const fieldMap = new Map(oldFields.map(field => [field.fieldPath, field]))

    for (const field of newFields) {
        fieldMap.set(field.fieldPath, field)
    }

    newFields = Array.from(fieldMap.values()).filter(
        field => field.fieldPath && field.values && field.values.length > 0 && (field.values[0] !== undefined || field.values[0] !== null)
        // field => field.fieldPath && field.values && field.values.length > 0 && field.values[0] && field.values[0].length > 0
    )

    return newFields
}

export const simpleFieldSelector = (fields: fieldSelector[]) => {
    const uniqueFields = fields.reduce((acc, field) => {
        const key = `${field.fieldPath}${field.operator || ''}`
        acc[key] = field
        return acc
    }, {} as { [key: string]: fieldSelector })

    const result = Object.values(uniqueFields)
        .map(({ fieldPath, value, operator }) => {
            let op = operator || ''
            return (value && value.length > 0) ? `${fieldPath}${op}${value}` : null
        })
        .filter(Boolean)
        .join(',')

    if (result.length === 0) {
        return []
    }
    return [result]
}

export const parseFieldSelector = (input?: string): fieldSelector[] => {
    if (!input) {
        return []
    }

    const operators = ['!=', '^=', '$=', '*=', '=', '~=', '!~=']

    return input.split(',').map(pair => {
        const operator = operators.find(op => pair.includes(op))

        if (!operator) {
            return null
        }

        const [fieldPath, value] = pair.split(operator)

        return {
            fieldPath: fieldPath.trim(),
            value: value ? value.trim() : undefined,
            operator: operator as '=' | '!=' | '^=' | '$=' | '*=' | '~=' | '!~='
        }
    }).filter((item) => item !== null)
}

// export const parseFieldSelector = (input: string): fieldSelector[] => {
//     const operators = ['!=', '^=', '$=', '*=', '='];

//     return input
//         .split(',')
//         .map(pair => {
//             const operator = operators.find(op => pair.includes(op));

//             if (!operator) {
//                 // 忽略无效项
//                 return null;
//             }

//             const [fieldPath, value] = pair.split(operator);

//             return {
//                 fieldPath: fieldPath.trim(),
//                 value: value ? value.trim() : undefined,
//                 operator: operator as '=' | '!=' | '^=' | '$=' | '*=',
//             };
//         })
//         .filter((item): item is fieldSelector => item !== null)
// }

export const getNamespaceFieldSelector = (namespace: string): FieldSelector => {
    return { fieldPath: 'metadata.namespace', values: [namespace], operator: '=' }
    // return { fieldPath: 'metadata.namespace', value: namespace, operator: '=' }
}

export const replaceDots = (input: string): string => {
    return input.replace(/\./g, '\\.')
}
