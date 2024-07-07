import { notification } from "antd"

export const useNotification = () => {
    const [api, contextHolder] = notification.useNotification()
    const showNotification = (type: "info" | "success" | "warning" | "error", message: string, description?: any) => {
        api[type]({
            message: message,
            description: description,
            showProgress: true,
            pauseOnHover: true
        })
    }

    return { contextHolder, showNotification }
}

export const useVirtualMachineNotification = () => {
    const [api, notificationContext] = notification.useNotification()

    const generator = (description: string) => {
        return {
            message: "Virtual Machine",
            description: description,
            showProgress: true,
            pauseOnHover: true
        }
    }

    class showVirtualMachineNotification {
        static success(description: any) {
            api.success(generator(description))
        }

        static warning(description: any) {
            api.warning(generator(description))
        }

        static error(error: any) {
            api.error(generator(error?.message))
        }

        static notify(type: "info" | "success" | "warning" | "error", description: any) {
            api[type](generator(description))
        }
    }

    return { notificationContext, showVirtualMachineNotification }
}

export const useDataVolumeNotification = () => {
    const [api, notificationContext] = notification.useNotification()

    const generator = (description: string) => {
        return {
            message: "Data Volume",
            description: description,
            showProgress: true,
            pauseOnHover: true
        }
    }

    class showDataVolumeNotification {
        static success(description: any) {
            api.success(generator(description))
        }

        static warning(description: any) {
            api.warning(generator(description))
        }

        static error(error: any) {
            api.error(generator(error?.message))
        }

        static notify(type: "info" | "success" | "warning" | "error", description: any) {
            api[type](generator(description))
        }
    }

    return { notificationContext, showDataVolumeNotification }
}


export const useNamespaceNotification = () => {
    const [api, notificationContext] = notification.useNotification()

    const generator = (description: string) => {
        return {
            message: "Namespace",
            description: description,
            showProgress: true,
            pauseOnHover: true
        }
    }

    class showNamespaceNotification {
        static success(description: any) {
            api.success(generator(description))
        }

        static warning(description: any) {
            api.warning(generator(description))
        }

        static error(error: any) {
            api.error(generator(error?.message))
        }

        static notify(type: "info" | "success" | "warning" | "error", description: any) {
            api[type](generator(description))
        }
    }

    return { notificationContext, showNamespaceNotification }
}

export const useVirtualMachineErrorNotification = () => {
    const [api, notificationContext] = notification.useNotification()
    const showVirtualMachineErrorNotification = (error: any) => {
        api.error({
            message: "Virtual Machine",
            description: error?.message,
            showProgress: true,
            pauseOnHover: true
        })
    }

    return { notificationContext, showVirtualMachineErrorNotification }
}

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

export const useSuccessNotification = () => {
    const [api, contextHolder] = notification.useNotification()
    const showSuccessNotification = (message: string) => {
        api.success({
            message: message,
            showProgress: true,
            pauseOnHover: true
        })
    }

    return { contextHolder, showSuccessNotification }
}

export const useWarningNotification = () => {
    const [api, contextHolder] = notification.useNotification()
    const showWarningNotification = (message: string) => {
        api.warning({
            message: message,
            showProgress: true,
            pauseOnHover: true
        })
    }

    return { contextHolder, showWarningNotification }
}

