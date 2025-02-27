import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const Network = lazy(() => import("@/pages/network/index"))
const Virtual = lazy(() => import("@/pages/virtual/index"))
const Physical = lazy(() => import("@/pages/physical/index"))
const Dashboard = lazy(() => import("@/pages/dashboard/index"))
const Plugin = lazy(() => import("@/pages/plugin/index"))
const Task = lazy(() => import("@/pages/task/index"))

const AppRouter = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/" element={lazyComponents(<Dashboard />)} />
                <Route path="dashboard/*" element={lazyComponents(<Dashboard />)} />
                <Route path="virtual/*" element={lazyComponents(<Virtual />)} />
                <Route path="physical/*" element={lazyComponents(<Physical />)} />
                <Route path="network/*" element={lazyComponents(<Network />)} />
                <Route path="plugin/*" element={lazyComponents(<Plugin />)} />
                <Route path="task/*" element={lazyComponents(<Task />)} />
            </Routes>
        </Suspense>
    )
}

export default AppRouter
