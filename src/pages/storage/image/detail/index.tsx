import { DetailYaml } from "@/components/detail-yaml"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"

export default () => {
    const { resource, loading } = useWatchResourceInNamespaceName(ResourceType.DATA_VOLUME)

    return <DetailYaml resourceType={ResourceType.DATA_VOLUME} resource={resource} loading={loading} backPath="/storage/images" />
}
