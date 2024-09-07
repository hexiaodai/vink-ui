import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const Virtual = lazy(() => import("@/pages/virtual/index"))

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
