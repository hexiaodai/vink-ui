import { CreateResourceWithYaml } from '@/components/create-resource-with-yaml'

export const subnetYaml = `
apiVersion: kubeovn.io/v1
kind: Subnet
metadata:
  name: subnet1
spec:
  protocol: IPv4
  provider: attachnet.default.ovn
  vpc: ovn-cluster
  cidrBlock: 10.66.0.0/16
  excludeIps:
    - 10.66.0.1..10.66.0.10
    - 10.66.0.101..10.66.0.151
  gateway: 10.66.0.1
  gatewayType: distributed
  natOutgoing: true
  routeTable: ''
  namespaces:
    - ns1
    - ns2
`

export default () => {
    return (
        <CreateResourceWithYaml data={subnetYaml} backout="/network/subnets" />
    )
}
