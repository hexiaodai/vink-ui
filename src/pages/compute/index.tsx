import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const MachineList = lazy(() => import("@/pages/compute/machine/list"))
const MachineCreate = lazy(() => import("@/pages/compute/machine/create"))

const Virtual = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="machines">
                        <Route path="" element={lazyComponents(<MachineList />)} />
                        <Route path="create" element={lazyComponents(<MachineCreate />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Virtual
