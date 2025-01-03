import { NamespaceName } from "@/clients/ts/types/types"
import { getNamespaceName } from "@/utils/utils"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"

export const useNamespaceFromURL = () => {
    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const [namespaceName, setNamespaceName] = useState<NamespaceName>(getNamespaceName(params))

    useEffect(() => {
        setNamespaceName(getNamespaceName(params))
    }, [location.search])

    return namespaceName
}
