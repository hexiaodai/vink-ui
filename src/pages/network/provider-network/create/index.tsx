import { CreateResourceWithYaml } from '@/components/create-resource-with-yaml'

export const vpcYaml = `
apiVersion: kubeovn.io/v1
kind: ProviderNetwork
metadata:
  name: net1
spec:
  defaultInterface: eth1
  customInterfaces:
    - interface: eth2
      nodes:
        - node1
  excludeNodes:
    - node2
`

export default () => {
    return (
        <CreateResourceWithYaml data={vpcYaml} backout="/network/provider-network" />
    )
}
