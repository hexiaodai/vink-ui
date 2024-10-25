import { Segmented, Space } from "antd"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Overview from "./overview"
import Volume from "./volume"
import Network from "./network"
import styles from "./styles/index.module.less"

const activeKey = "active"

export default () => {
    const location = useLocation()
    const navigate = useNavigate()

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
            <Segmented
                value={active}
                onChange={(e) => {
                    params.set(activeKey, e)
                    navigate({ search: params.toString() }, { replace: true })
                }}
                options={["概览", "监控", "存储", "网络", "快照", "事件"]}
            />

            {active === "概览" && <Overview />}
            {active === "存储" && <Volume />}
            {active === "网络" && <Network />}
        </Space >
    )
}
