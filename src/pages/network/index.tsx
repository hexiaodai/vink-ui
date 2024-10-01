import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const MultusList = lazy(() => import("@/pages/network/multus/list"))
const MultusCreate = lazy(() => import("@/pages/network/multus/create"))

const SubnetList = lazy(() => import("@/pages/network/subnet/list"))
const SubnetCreate = lazy(() => import("@/pages/network/subnet/create"))

const VpcList = lazy(() => import("@/pages/network/vpc/list"))
const VpcCreate = lazy(() => import("@/pages/network/vpc/create"))

const IPPoolList = lazy(() => import("@/pages/network/ippool/list"))
const IPPoolCreate = lazy(() => import("@/pages/network/ippool/create"))

const Virtual = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    {/* <Route path="" element={lazyComponents(<MachineList />)} /> */}
                    <Route path="multus">
                        <Route path="" element={lazyComponents(<MultusList />)} />
                        <Route path="create" element={lazyComponents(<MultusCreate />)} />
                    </Route>
                    <Route path="subnets">
                        <Route path="" element={lazyComponents(<SubnetList />)} />
                        <Route path="create" element={lazyComponents(<SubnetCreate />)} />
                    </Route>
                    <Route path="vpcs">
                        <Route path="" element={lazyComponents(<VpcList />)} />
                        <Route path="create" element={lazyComponents(<VpcCreate />)} />
                    </Route>
                    <Route path="ippools">
                        <Route path="" element={lazyComponents(<IPPoolList />)} />
                        <Route path="create" element={lazyComponents(<IPPoolCreate />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Virtual
