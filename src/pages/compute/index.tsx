import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const HostList = lazy(() => import("@/pages/compute/host/list"))
const HostMonitor = lazy(() => import("@/pages/compute/host/monitor"))

const MachineList = lazy(() => import("@/pages/compute/machine/list"))
const MachineCreate = lazy(() => import("@/pages/compute/machine/create"))
const MachineDetail = lazy(() => import("@/pages/compute/machine/detail"))

const Virtual = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="hosts">
                        <Route path="" element={lazyComponents(<HostList />)} />
                        <Route path="monitor" element={lazyComponents(<HostMonitor />)} />
                    </Route>
                    <Route path="machines">
                        <Route path="" element={lazyComponents(<MachineList />)} />
                        <Route path="create" element={lazyComponents(<MachineCreate />)} />
                        <Route path="detail" element={lazyComponents(<MachineDetail />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Virtual
