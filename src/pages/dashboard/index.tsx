import { Grafana, GrafanaProps } from "@/components/grafana"

export default () => {
    const dash: GrafanaProps = { overviewUID: "vink-dashboard", panelID: "vink-dashboard", clearPadding: true }

    return (
        <Grafana {...dash} />
    )
}
