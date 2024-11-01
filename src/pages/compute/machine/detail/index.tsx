import { Flex, Segmented, Space } from "antd"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import Overview from "./overview"
import Volume from "./volume"
import Network from "./network"
import YAML from "./yaml"
import styles from "./styles/index.module.less"
import VirtualMachineManagement from "@/pages/compute/machine/components/management"

const activeKey = "active"

export default () => {
    const location = useLocation()

    const navigate = useNavigate()

    const namespaceName = useNamespaceFromURL()

    const params = new URLSearchParams(location.search)

    const [active, setActive] = useState(params.get(activeKey) || "概览")

    useEffect(() => {
        const newActive = params.get(activeKey)
        if (!newActive || active == newActive) {
            return
        }
        setActive(newActive)
    }, [history, location.search])

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
                    options={["YAML", "概览", "监控", "存储", "网络", "快照", "事件"]}
                />

                <VirtualMachineManagement type="detail" namespace={namespaceName} />
            </Flex>

            {active === "概览" && <Overview />}
            {active === "存储" && <Volume />}
            {active === "网络" && <Network />}
            {active === "YAML" && <YAML />}
        </Space >
    )
}
