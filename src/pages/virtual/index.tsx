import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

// const HostList = lazy(() => import("@/pages/virtual/host/list"))
// const HostMonitor = lazy(() => import("@/pages/virtual/host/monitor"))

const MachineList = lazy(() => import("@/pages/virtual/machine/list"))
const MachineCreate = lazy(() => import("@/pages/virtual/machine/create"))
const MachineDetail = lazy(() => import("@/pages/virtual/machine/detail"))

const ImageList = lazy(() => import("@/pages/virtual/image/list"))
const ImageCreate = lazy(() => import("@/pages/virtual/image/create"))

const DiskList = lazy(() => import("@/pages/virtual/disk/list"))
const DiskCreate = lazy(() => import("@/pages/virtual/disk/create"))

const Virtual = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    {/* <Route path="hosts">
                        <Route path="" element={lazyComponents(<HostList />)} />
                        <Route path="monitor" element={lazyComponents(<HostMonitor />)} />
                    </Route> */}
                    <Route path="machines">
                        <Route path="" element={lazyComponents(<MachineList />)} />
                        <Route path="create" element={lazyComponents(<MachineCreate />)} />
                        <Route path="detail" element={lazyComponents(<MachineDetail />)} />
                    </Route>
                    <Route path="images">
                        <Route path="" element={lazyComponents(<ImageList />)} />
                        <Route path="create" element={lazyComponents(<ImageCreate />)} />
                    </Route>
                    <Route path="disks">
                        <Route path="" element={lazyComponents(<DiskList />)} />
                        <Route path="create" element={lazyComponents(<DiskCreate />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Virtual
