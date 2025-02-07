import { Grafana, GrafanaProps } from "@/components/grafana"

export default () => {
    const stat: GrafanaProps = { overviewUID: "vink-stats", panelID: "vink-stats", defaultHeight: 336 }
    const dash: GrafanaProps = { overviewUID: "3e97d1d02672cdd0861f4c97c64f89b2", panelID: "node-exporter-use-method-cluster" }

    return (
        <>
            <Grafana {...stat} />
            <Grafana {...dash} />
        </>
    )
}
