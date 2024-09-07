import { RequestData } from "@ant-design/pro-components"

export const transformResponse = async (result: Promise<any>): Promise<Partial<RequestData<any>>> => {
    const output = { data: [], success: false }
    try {
        const temp = await result
        output.data = temp.items
        output.success = true
    } catch { }
    return output
}
