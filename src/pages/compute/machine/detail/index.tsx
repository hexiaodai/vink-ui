import { Flex, Segmented, Space } from "antd"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import Overview from "./overview"
import Volume from "./storage"
import Network from "./network"
import YAML from "./yaml"
import Event from "./event"
import styles from "./styles/index.module.less"
import VirtualMachineManagement from "@/pages/compute/machine/components/management"

const activeKey = "active"

export default () => {
    const location = useLocation()

    const navigate = useNavigate()

    const namespaceName = useNamespaceFromURL()

    const params = new URLSearchParams(location.search)

    const [active, setActive] = useState(params.get(activeKey) || "Overview")

    useEffect(() => {
        const newActive = params.get(activeKey)
        if (!newActive || active == newActive) {
            return
        }
        setActive(newActive)
    }, [history, location.search])

    const renderComponent = () => {
        switch (active.toLowerCase()) {
            case "overview":
                return <Overview />
            case "storage":
                return <Volume />
            case "network":
                return <Network />
            case "yaml":
                return <YAML />
            case "event":
                return <Event />
            default:
                return null
        }
    }

    return (
        <Space
            direction="vertical"
            size="middle"
            className={styles["space-container"]}
        >
            <Flex justify="space-between">
                <Segmented
                    value={active}
                    onChange={(e) => {
                        params.set(activeKey, e)
                        navigate({ search: params.toString() }, { replace: true })
                    }}
                    options={["YAML", "Overview", "Monitor", "Storage", "Network", "Snapshot", "Event"]}
                />

                <VirtualMachineManagement type="detail" namespace={namespaceName} />
            </Flex>

            {renderComponent()}
        </Space >
    )
}
