import React, { useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'

interface Props {
    action?: { reload: () => void }
    children?: React.ReactNode | (() => React.ReactNode)
}

export const ReloadableValue: React.FC<Props> = ({ action, children }) => {
    const [reload, setReload] = useState(false)

    // const value = children()
    const value = typeof children === 'function' ? (children as () => React.ReactNode)() : children

    if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
            <ReloadOutlined
                onClick={() => {
                    if (!action) {
                        return
                    }
                    action.reload()
                    setReload(true)
                    setTimeout(() => { setReload(false) }, 1000)
                }}
                spin={reload}
                style={{ cursor: 'pointer' }}
            />
        )
    }

    return <>{value}</>
}
