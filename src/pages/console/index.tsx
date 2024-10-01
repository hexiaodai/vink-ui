import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'
import styles from '@/pages/console/index.module.less'
import 'xterm/css/xterm.css'

const str2ab = (str: string) => {
    const enc = new TextEncoder()
    return enc.encode(str)
}

const useQuery = () => {
    return new URLSearchParams(window.location.search)
}

const SerialConsole: React.FC = () => {
    const query = useQuery()
    const host = window.location.host

    const namespace = query.get('namespace')
    const name = query.get('name')

    const divRef = useRef<HTMLDivElement>(null)
    const terminalRef = useRef<Terminal | null>(null)
    const wsRef = useRef<WebSocket | null>(null)

    const initializeTerminal = () => {
        const terminal = new Terminal({
            cursorBlink: true,
            allowProposedApi: true,
            fontSize: 16,
            lineHeight: 1.2,
            theme: {
                foreground: '#F8F8F8',
                background: '#2D2E2C'
            },
            fontFamily: '"Cascadia Code", Menlo, monospace'
        })

        const fitAddon = new FitAddon()
        terminal.loadAddon(fitAddon)
        terminal.loadAddon(new WebLinksAddon())

        const ws = new WebSocket(`ws://${host}/apis/vink.io/v1alpha1/namespaces/${namespace}/virtualmachines/${name}/console`)
        ws.onopen = () => {
            terminal.open(divRef.current!)
            fitAddon.fit()
            terminal.loadAddon(new WebglAddon())
            terminal.focus()

            ws.send(str2ab("\n"))

            window.onresize = () => {
                fitAddon.fit()
            }
        }

        // FIXME: Need to retry
        ws.onerror = (err) => {
            console.log(err)
        }

        ws.onmessage = async (event) => {
            const rawData = await event.data.arrayBuffer()
            const decoder = new TextDecoder('utf-8')
            const text = decoder.decode(rawData)
            terminal.write(text)
        }

        ws.onerror = (err) => {
            terminal.write(`Websocket connection error: ${err}`)
        }

        terminal.onData((b) => {
            const msg = str2ab(b)
            ws.send(msg)
        })

        return { terminal, ws }
    }

    useEffect(() => {
        if (!namespace || !name) {
            return
        }

        const { terminal, ws } = initializeTerminal()

        terminalRef.current = terminal
        wsRef.current = ws

        return () => {
            ws.close()
            terminal.dispose()
            terminalRef.current = null
            wsRef.current = null
        }
    }, [namespace, name])

    return <div className={styles["serial-console"]} ref={divRef} />
}

export default SerialConsole

const fit = (fitAddon: FitAddon, ws: WebSocket) => {
    fitAddon.fit()

    const dimensions = fitAddon.proposeDimensions()
    const rows = dimensions?.rows ?? 100
    const cols = dimensions?.cols ?? 100

    const message = JSON.stringify({
        Width: cols,
        Height: rows
    })

    ws.send(str2ab(message))
}