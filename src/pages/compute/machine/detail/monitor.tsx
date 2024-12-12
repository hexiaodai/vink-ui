import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"

const vmiOverviewUID = "vmi-overview-zh"

const vmiPanelID = "vmi-zi-yuan-mian-ban"

const orgID = 1

const cpuPanelID = 19
const memPanelID = 21
const networkTrafficPanelID = 23
const networkErrorPanelID = 25
const networkPacketsDroppedPanelID = 27
const storageTrafficPanelID = 29
const storageIOPSPanelID = 31
const storageTimesSecondsPanelID = 33

const panelIDs = [
    cpuPanelID,
    memPanelID,
    networkTrafficPanelID,
    networkErrorPanelID,
    networkPacketsDroppedPanelID,
    storageTrafficPanelID,
    storageIOPSPanelID,
    storageTimesSecondsPanelID
]

const theme = "light"

const timeRange = "8h"

export default () => {
    const namespaceName = useNamespaceFromURL()

    return (
        <>
            {panelIDs.map(panelID => (
                <iframe
                    key={panelID}
                    src={`${window.location.origin}/grafana/d-solo/${vmiOverviewUID}/${vmiPanelID}?orgId=${orgID}&from=now-${timeRange}&to=now&theme=${theme}&panelId=${panelID}&var-namespace=${namespaceName.namespace}&var-vmi_name=${namespaceName.name}`}
                    width="100%"
                    height="250"
                    style={{ border: 'none' }}
                />
            ))}
        </>
    )
}
