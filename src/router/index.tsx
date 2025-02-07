import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const Storage = lazy(() => import("@/pages/storage/index"))
const Network = lazy(() => import("@/pages/network/index"))
const Compute = lazy(() => import("@/pages/compute/index"))
const Dashboard = lazy(() => import("@/pages/dashboard/index"))

const AppRouter = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/" />
                <Route path="dashboard/*" element={lazyComponents(<Dashboard />)} />
                <Route path="compute/*" element={lazyComponents(<Compute />)} />
                <Route path="network/*" element={lazyComponents(<Network />)} />
                <Route path="physical/*" />
                <Route path="storage/*" element={lazyComponents(<Storage />)} />
            </Routes>
        </Suspense>
    )
}

export default AppRouter
