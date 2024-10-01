import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/resource-manager/clients"
import { emptyOptions } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"

export const fetchNamespaces = (setNamespace: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.NAMESPACE
                }
            },
            options: emptyOptions()
        })
        call.responses.onMessage(response => {
            setNamespace(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "Namespace", description: err.message })
            reject()
        })
    })
}
