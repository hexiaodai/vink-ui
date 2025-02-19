import { Badge } from 'antd'

interface Props {
    crd?: any
    ready?: boolean
}

const DefaultStatus: React.FC<Props> = ({ crd, ready }) => {
    if (crd) {
        const readyCondition = crd.status?.conditions?.find((c: any) => c.type === 'Ready')
        if (readyCondition && readyCondition.status === 'True') {
            ready = true
        }
    }
    if (ready) {
        return <Badge status="success" text="Ready" />
    }
    return <Badge status="default" text="Not Ready" />
}

export default DefaultStatus
