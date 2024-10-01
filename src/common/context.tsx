import React, { createContext, useContext, useState } from 'react'

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
    const [namespace, setNamespace] = useState("")

    return (
        <NamespaceContext.Provider value={{ namespace, setNamespace }}>
            {children}
        </NamespaceContext.Provider>
    )
}
