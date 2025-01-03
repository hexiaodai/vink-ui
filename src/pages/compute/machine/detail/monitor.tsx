import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"

const overviewUID = "vink-overview-zh"

const panelID = "kubevirt-zi-yuan-mian-ban"

const theme = "light"

const timeRange = "1h"

const kiosk = "true"

const refresh = "5s"

export default () => {
    const namespaceName = useNamespaceFromURL()

    return (
        <iframe
            key={panelID}
            src={`${window.location.origin}/grafana/d/${overviewUID}/${panelID}?var-namespace=${namespaceName.namespace}&var-vm=${namespaceName.name}&from=now-${timeRange}&to=now&refresh=${refresh}&kiosk=${kiosk}&theme=${theme}`}
            width="100%"
            height="2300"
            style={{ border: 'none' }}
        />
    )
}
