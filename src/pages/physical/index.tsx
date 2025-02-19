import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const MachineList = lazy(() => import("@/pages/physical/machine/list"))
const MachineMonitor = lazy(() => import("@/pages/physical/machine/monitor"))

const StorageList = lazy(() => import("@/pages/physical/storage/list"))

const Physical = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="machines">
                        <Route path="" element={lazyComponents(<MachineList />)} />
                        <Route path="monitor" element={lazyComponents(<MachineMonitor />)} />
                    </Route>
                    <Route path="storages" element={lazyComponents(<StorageList />)} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Physical
