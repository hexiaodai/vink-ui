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
    clearPadding?: boolean
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
    clearPadding: false
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
        queryParams = defaultGrafanaProps.queryParams,
        clearPadding = defaultGrafanaProps.clearPadding
    } = props

    const iframeRef = useRef<HTMLIFrameElement>(null)

    const [iframeHeight, setIframeHeight] = useState(defaultHeight)

    // useEffect(() => {
    //     const applyCustomCSS = () => {
    //         if (!iframeRef.current) return

    //         const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    //         if (!iframeDocument) return

    //         const style = iframeDocument.createElement("style")
    //         style.innerHTML = `
    //             .css-e3bxl8-body {
    //                 padding: 0 !important;
    //             }
    //             html, body {
    //                 margin: 0;
    //                 padding: 0;
    //                 min-height: 100%;
    //                 overflow-x: hidden;
    //             }
    //         `
    //         iframeDocument.head.appendChild(style)
    //     }

    //     let lastHeight = 0
    //     let heightTimeout: NodeJS.Timeout | null = null

    //     const adjustIframeHeight = () => {
    //         if (!iframeRef.current) return

    //         const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    //         if (!iframeDocument) return

    //         requestAnimationFrame(() => {
    //             const bodyHeight = iframeDocument.body.scrollHeight
    //             const docHeight = iframeDocument.documentElement.scrollHeight
    //             const newHeight = Math.max(bodyHeight, docHeight)

    //             if (Math.abs(newHeight - lastHeight) > 5) {
    //                 lastHeight = newHeight
    //                 setIframeHeight(newHeight)
    //             }
    //         })
    //     }

    //     const onIframeLoad = () => {
    //         if (!iframeRef.current) return

    //         const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    //         if (!iframeDocument) return

    //         if (clearPadding) {
    //             applyCustomCSS()
    //         }
    //         setTimeout(adjustIframeHeight, 100) // **确保 iframe 加载完成后调整**

    //         // **MutationObserver** - 监听 DOM 变化
    //         const observer = new MutationObserver(() => {
    //             if (heightTimeout) clearTimeout(heightTimeout)
    //             heightTimeout = setTimeout(adjustIframeHeight, 300) // **防抖**
    //         })

    //         observer.observe(iframeDocument.body, { childList: true, subtree: true, attributes: true })

    //         // **ResizeObserver** - 监听元素大小变化
    //         const resizeObserver = new ResizeObserver(() => {
    //             if (heightTimeout) clearTimeout(heightTimeout)
    //             heightTimeout = setTimeout(adjustIframeHeight, 300)
    //         })

    //         resizeObserver.observe(iframeDocument.documentElement)

    //         return () => {
    //             observer.disconnect();
    //             resizeObserver.disconnect();
    //             if (heightTimeout) clearTimeout(heightTimeout)
    //         }
    //     }

    //     if (iframeRef.current) {
    //         iframeRef.current.onload = onIframeLoad
    //     }
    // }, [])

    useEffect(() => {
        const applyCustomCSS = () => {
            if (!iframeRef.current) return

            const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
            if (!iframeDocument) return

            const style = iframeDocument.createElement("style")
            style.innerHTML = `
                html, body {
                    margin: 0;
                    padding: 0;
                    min-height: 100%;
                    overflow-x: hidden;
                }
                .css-e3bxl8-body {
                    padding: 0 !important;
                }
            `
            iframeDocument.head.appendChild(style)
        }

        const adjustIframeHeight = () => {
            if (!iframeRef.current) return

            const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
            if (!iframeDocument || iframeHeight === iframeDocument.body.scrollHeight) return

            setIframeHeight(iframeDocument.body.scrollHeight)
        }

        const onIframeLoad = () => {
            if (clearPadding) {
                applyCustomCSS()
            }
            setTimeout(adjustIframeHeight, 100)

            const observer = new MutationObserver(() => {
                adjustIframeHeight()
            })

            const iframeDocument = iframeRef.current?.contentDocument
            if (iframeDocument) {
                observer.observe(iframeDocument.body, { childList: true, subtree: true })
            }

            return () => observer.disconnect()
        }

        if (iframeRef.current) {
            iframeRef.current.onload = onIframeLoad
        }
    }, [])

    // useEffect(() => {
    //     const adjustIframeHeight = () => {
    //         if (iframeRef.current) {
    //             const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    //             if (iframeDocument) {
    //                 const contentHeight = iframeDocument.body.scrollHeight
    //                 setIframeHeight(contentHeight)
    //             }
    //         }
    //     }

    //     const applyCustomCSS = () => {
    //         if (iframeRef.current) {
    //             const iframeDocument = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
    //             if (iframeDocument) {
    //                 const style = iframeDocument.createElement("style")
    //                 style.innerHTML = `
    //                     .css-e3bxl8-body {
    //                         padding: 0 !important;
    //                     }
    //                 `
    //                 iframeDocument.head.appendChild(style)
    //             }
    //         }
    //     }

    //     if (clearPadding) {
    //         applyCustomCSS()
    //     }
    //     adjustIframeHeight()

    //     const interval = setInterval(() => {
    //         if (clearPadding) {
    //             applyCustomCSS()
    //         }
    //         // adjustIframeHeight()
    //     }, 500)

    //     return () => clearInterval(interval)
    // }, [])

    const queryString = new URLSearchParams({
        timezone: timezone,
        from: `now-${timeRange}`,
        to: "now",
        refresh: refresh,
        theme: theme,
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
