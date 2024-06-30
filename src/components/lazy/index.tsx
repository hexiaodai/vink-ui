import { ReactNode } from 'react'
import { Suspense } from "react"

export const lazyComponents = (element: ReactNode): ReactNode => {
    return (
        <Suspense>
            {element}
        </Suspense>
    )
}
