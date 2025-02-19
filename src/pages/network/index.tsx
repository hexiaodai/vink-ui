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

const ProviderNetworkList = lazy(() => import("@/pages/network/provider-network/list"))
const ProviderNetworkCreate = lazy(() => import("@/pages/network/provider-network/create"))

const VLANList = lazy(() => import("@/pages/network/vlan/list"))
const VLANCreate = lazy(() => import("@/pages/network/vlan/create"))

const Network = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
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
                    <Route path="provider-networks">
                        <Route path="" element={lazyComponents(<ProviderNetworkList />)} />
                        <Route path="create" element={lazyComponents(<ProviderNetworkCreate />)} />
                    </Route>
                    <Route path="vlans">
                        <Route path="" element={lazyComponents(<VLANList />)} />
                        <Route path="create" element={lazyComponents(<VLANCreate />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Network
