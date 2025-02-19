import { Badge } from 'antd'
import { VirtualMachine } from '@/clients/virtual-machine'
import { containsErrorKeywords, containsProcessing } from '@/utils/utils'

interface Props {
    vm: VirtualMachine
}

const VirtualMachineStatus: React.FC<Props> = ({ vm }) => {
    const status = vm.status?.printableStatus
    if (!status) {
        return <Badge status="default" text="Unknown" />
    }

    if (status.toLowerCase() === 'running') {
        return <Badge status="success" text={status} />
    }

    if (containsErrorKeywords(status)) {
        return <Badge status="error" text={status} />
    }

    if (containsProcessing(status)) {
        return <Badge status="processing" text={status} />
    }

    return <Badge status="default" text={status} />
}

export default VirtualMachineStatus
