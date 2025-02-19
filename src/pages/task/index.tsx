import { lazy } from 'react'
import { Route, Routes } from "react-router-dom"
import { Suspense } from "react"
import { lazyComponents } from '@/components/lazy'

const EventList = lazy(() => import("@/pages/task/event"))
const CloneList = lazy(() => import("@/pages/task/clone"))

const Task = () => {
    return (
        <Suspense>
            <Routes>
                <Route path="/">
                    <Route path="events" element={lazyComponents(<EventList />)} />
                    <Route path="clones" element={lazyComponents(<CloneList />)} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default Task
