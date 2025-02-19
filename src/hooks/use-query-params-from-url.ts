import { NamespaceName } from "@/clients/ts/types/types"
import { getNamespaceName, getNamespaceName2 } from "@/utils/utils"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export const useNamespaceFromURL = () => {
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const [namespaceName, setNamespaceName] = useState<NamespaceName>(getNamespaceName(params))

    useEffect(() => {
        const newns = getNamespaceName(params)
        if (newns.namespace === namespaceName.namespace && newns.name === namespaceName.name) {
            return
        }
        setNamespaceName(newns)
    }, [location.search])

    return namespaceName
}

export const useNamespaceNameFromURL = () => {
    const location = useLocation()
    const params = new URLSearchParams(location.search)

    const [namespaceName, setNamespaceName] = useState<NamespaceName | undefined>(getNamespaceName2(params))

    useEffect(() => {
        const newnn = getNamespaceName2(params)
        if (!newnn) {
            return
        }
        if (namespaceName && newnn.namespace === namespaceName.namespace && newnn.name === namespaceName.name) {
            return
        }
        setNamespaceName(newnn)
    }, [location.search])

    return namespaceName
}
