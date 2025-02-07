import { useEffect, useRef, useState } from "react"

export interface GrafanaProps {
    overviewUID: string
    panelID: string
    theme?: string
    timeRange?: string
    refresh?: string
    timezone?: string
    hideTimePicker?: boolean
    hideVariables?: boolean
    defaultHeight?: number
    queryParams?: Record<string, string>
}

const defaultGrafanaProps: Required<Omit<GrafanaProps, "overviewUID" | "panelID">> = {
    theme: "light",
    timeRange: "1h",
    refresh: "5m",
    timezone: "utc",
    hideTimePicker: true,
    hideVariables: true,
    defaultHeight: window.innerHeight,
    queryParams: {},
}

export const Grafana: React.FC<GrafanaProps> = (props) => {
    const {
        overviewUID,
        panelID,
        theme = defaultGrafanaProps.theme,
        timeRange = defaultGrafanaProps.timeRange,
        refresh = defaultGrafanaProps.refresh,
        timezone = defaultGrafanaProps.timezone,
        hideTimePicker = defaultGrafanaProps.hideTimePicker ? "true" : "false",
        hideVariables = defaultGrafanaProps.hideVariables ? "true" : "false",
        defaultHeight = defaultGrafanaProps.defaultHeight,
        queryParams = defaultGrafanaProps.queryParams
    } = props

    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [iframeHeight, setIframeHeight] = useState(defaultHeight)

    useEffect(() => {
        const adjustIframeHeight = () => {
            if (iframeRef.current) {
                const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
                if (iframeDocument) {
                    const contentHeight = iframeDocument.body.scrollHeight
                    setIframeHeight(contentHeight)
                }
            }
        }

        adjustIframeHeight()

        const interval = setInterval(adjustIframeHeight, 500)

        return () => clearInterval(interval)
    }, [])

    const queryString = new URLSearchParams({
        timezone: timezone,
        from: `now-${timeRange}`,
        to: "now",
        refresh: refresh,
        theme: theme,
        // kiosk: "",
        "_dash.hideTimePicker": String(hideTimePicker),
        "_dash.hideVariables": String(hideVariables),
        ...queryParams,
    }).toString()

    return (
        <iframe
            ref={iframeRef}
            key={panelID}
            src={`${window.location.origin}/grafana/d/${overviewUID}/${panelID}?${queryString}&kiosk`}
            width="100%"
            height={iframeHeight}
            style={{ border: 'none' }}
        />
    )
}
