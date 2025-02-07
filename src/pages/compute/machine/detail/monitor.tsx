import { Grafana, GrafanaProps } from "@/components/grafana"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"

export default () => {
    const namespaceName = useNamespaceFromURL()

    const dash: GrafanaProps = {
        overviewUID: "vink-overview-zh",
        panelID: "kubevirt-zi-yuan-mian-ban",
        hideTimePicker: false,
        queryParams: { "var-namespace": namespaceName.namespace, "var-vm": namespaceName.name }
    }

    return (
        <Grafana {...dash} />
    )
}

// import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
// import { useEffect, useRef, useState } from "react"

// const overviewUID = "vink-overview-zh"

// const panelID = "kubevirt-zi-yuan-mian-ban"

// const theme = "light"

// const timeRange = "1h"

// const refresh = "30s"

// const timezone = "utc"

// const hideTimePicker = "false"

// const hideVariables = "true"

// export default () => {
//     const namespaceName = useNamespaceFromURL()

//     const iframeRef = useRef<HTMLIFrameElement>(null)

//     const [iframeHeight, setIframeHeight] = useState(window.innerHeight)

//     useEffect(() => {
//         const adjustIframeHeight = () => {
//             if (iframeRef.current) {
//                 const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
//                 if (iframeDocument) {
//                     const contentHeight = iframeDocument.body.scrollHeight
//                     setIframeHeight(contentHeight)
//                 }
//             }
//         }

//         adjustIframeHeight()

//         const interval = setInterval(adjustIframeHeight, 500)

//         return () => clearInterval(interval)
//     }, [])

//     return (
//         <iframe
//             ref={iframeRef}
//             key={panelID}
//             src={`${window.location.origin}/grafana/d/${overviewUID}/${panelID}?var-namespace=${namespaceName.namespace}&var-vm=${namespaceName.name}&timezone=${timezone}&from=now-${timeRange}&to=now&refresh=${refresh}&theme=${theme}&kiosk&_dash.hideTimePicker=${hideTimePicker}&_dash.hideVariables=${hideVariables}`}
//             width="100%"
//             height={iframeHeight}
//             style={{ border: 'none' }}
//         />
//     )
// }
