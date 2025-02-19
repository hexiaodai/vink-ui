import { Tabs } from 'antd'
import { useNamespaceFromURL } from '@/hooks/use-query-params-from-url'
import { useLocation, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import type { TabsProps } from 'antd'
import Overview from "./overview"
import Snapshot from "./snapshot"
import Network from "./network"
import Storage from "./storage"
import VirtualMachineManagement from "@/pages/virtual/machine/components/management"

const activeKey = "active"

const defaultActive = "overview"

const items: TabsProps['items'] = [
    {
        key: 'overview',
        label: '总览',
        children: <Overview />
    },
    {
        key: 'disk',
        label: '磁盘',
        children: <Storage />
    },
    {
        key: 'network',
        label: '网络',
        children: <Network />
    },
    {
        key: 'snapshot',
        label: '快照',
        children: <Snapshot />
    }
]

export default () => {
    const location = useLocation()

    const params = new URLSearchParams(location.search)

    const navigate = useNavigate()

    const nn = useNamespaceFromURL()

    const slot = <VirtualMachineManagement type="detail" nn={nn} />

    const [active, setActive] = useState(params.get(activeKey) || defaultActive)

    useEffect(() => {
        const newActive = params.get(activeKey)
        if (!newActive || active == newActive) {
            return
        }
        setActive(newActive)
    }, [history, location.search])

    return (
        <Tabs
            destroyInactiveTabPane
            defaultActiveKey={active}
            tabBarExtraContent={slot}
            onChange={(e) => {
                params.set(activeKey, e)
                navigate({ search: params.toString() }, { replace: true })
            }}
            items={items}
        />
    )
}
