import { Grafana, GrafanaProps } from "@/components/grafana"

export default () => {
    const dash: GrafanaProps = {
        overviewUID: "7d57716318ee0dddbac5a7f451fb7753",
        panelID: "node-exporter-nodes",
        hideTimePicker: false,
    }

    return (
        <Grafana {...dash} />
    )
}
