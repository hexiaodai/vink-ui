import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const Virtual = lazy(() => import("@/pages/virtual/index"))

// const SerialConsole = lazy(() => import("@/pages/virtual/machine/console/index"))

const AppRouter = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/" />
                <Route path="virtual/*" element={lazyComponents(<Virtual />)} />
                <Route path="physical/*" />
            </Routes>
        </Suspense>
    )
}

export default AppRouter

// export const OverlayRouter = () => {
//     return (
//         <Suspense>
//             <Routes>
//                 <Route path="console" element={lazyComponents(<SerialConsole />)} />
//             </Routes>
//         </Suspense>
//     )
// }