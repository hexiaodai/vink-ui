import { DetailYaml } from "@/components/detail-yaml"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"

export default () => {
    const { resource, loading } = useWatchResourceInNamespaceName(ResourceType.VIRTUAL_MACHINE)

    return <DetailYaml resourceType={ResourceType.VIRTUAL_MACHINE} resource={resource} loading={loading} backPath="/compute/machines" />
}
