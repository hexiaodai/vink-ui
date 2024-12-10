import { DetailYaml } from "@/components/detail-yaml"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResourceInName } from "@/hooks/use-resource"

export default () => {
    const { resource, loading } = useWatchResourceInName(ResourceType.IPPOOL)

    return <DetailYaml resourceType={ResourceType.IPPOOL} resource={resource} loading={loading} backPath="/network/ippools" />
}
