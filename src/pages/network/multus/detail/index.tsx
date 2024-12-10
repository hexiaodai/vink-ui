import { DetailYaml } from "@/components/detail-yaml"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"

export default () => {
    const { resource, loading } = useWatchResourceInNamespaceName(ResourceType.MULTUS)

    return <DetailYaml resourceType={ResourceType.MULTUS} resource={resource} loading={loading} backPath="/network/multus" />
}
