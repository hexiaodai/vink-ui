import { Grafana, GrafanaProps } from "@/components/grafana"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"

export default () => {
    const ns = useNamespaceFromURL()

    const dash: GrafanaProps = {
        overviewUID: "vink-physicalmachine",
        panelID: "vink-physicalmachine",
        hideTimePicker: false,
        clearPadding: true,
        queryParams: { "var-nodename": ns.name }
    }

    return (
        <Grafana {...dash} />
    )
}
