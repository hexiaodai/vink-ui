import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const ImageList = lazy(() => import("@/pages/storage/image/list"))
const ImageCreate = lazy(() => import("@/pages/storage/image/create"))
const ImageDetail = lazy(() => import("@/pages/storage/image/detail"))

const DiskList = lazy(() => import("@/pages/storage/disk/list"))
const DiskCreate = lazy(() => import("@/pages/storage/disk/create"))
const DiskDetail = lazy(() => import("@/pages/storage/disk/detail"))

const Storage = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="images">
                        <Route path="" element={lazyComponents(<ImageList />)} />
                        <Route path="create" element={lazyComponents(<ImageCreate />)} />
                        <Route path="detail" element={lazyComponents(<ImageDetail />)} />
                    </Route>
                    <Route path="disks">
                        <Route path="" element={lazyComponents(<DiskList />)} />
                        <Route path="create" element={lazyComponents(<DiskCreate />)} />
                        <Route path="detail" element={lazyComponents(<DiskDetail />)} />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Storage
