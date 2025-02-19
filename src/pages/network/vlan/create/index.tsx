import { CreateResourceWithYaml } from "@/components/create-resource-with-yaml"

export const vlanYaml = `
apiVersion: kubeovn.io/v1
kind: Vlan
metadata:
  name: vlan1
spec:
  id: 0
  provider: net1
`

export default () => {
    return (
        <CreateResourceWithYaml data={vlanYaml} backout="/network/vlans" />
    )
}
