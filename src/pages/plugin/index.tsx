import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const Installer = lazy(() => import("@/pages/plugin/installer"))

const Plugin = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="installer" element={lazyComponents(<Installer />)}></Route>
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Plugin
