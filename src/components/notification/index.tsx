import { notification } from "antd"

export const useErrorNotification = () => {
    const [api, contextHolder] = notification.useNotification()
    const showErrorNotification = (message: string, error: any) => {
        api.error({
            message: message,
            description: error?.message,
            showProgress: true,
            pauseOnHover: true
        })
    }

    return { contextHolder, showErrorNotification }
}
