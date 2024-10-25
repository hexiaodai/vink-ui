import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const key = "namespace"

const NamespaceContext = createContext<{
    namespace: string
    setNamespace: React.Dispatch<React.SetStateAction<string>>
} | undefined>(undefined)

export const useNamespace = () => {
    const context = useContext(NamespaceContext)
    if (!context) {
        throw new Error('useNamespace must be used within a NamespaceProvider')
    }
    return context
}

export const NamespaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()

    const params = new URLSearchParams(location.search)

    const [namespace, setNamespace] = useState<string>(params.get(key) || "")

    useEffect(() => {
        const detailPathRegex = /\/[^\/]+\/[^\/]+\/detail$/
        if (detailPathRegex.test(location.pathname)) {
            return
        }

        if (namespace) {
            params.set(key, namespace)
        } else {
            params.delete(key)
        }
        navigate({ search: params.toString() }, { replace: true })
    }, [namespace, history, location.search])

    // const [namespace, setNamespace] = useState(localStorage.getItem(key) || "")

    // useEffect(() => {
    //     if (!namespace) {
    //         return
    //     }
    //     localStorage.setItem(key, namespace)
    // }, [namespace])

    return (
        <NamespaceContext.Provider value={{ namespace, setNamespace }}>
            {children}
        </NamespaceContext.Provider>
    )
}
