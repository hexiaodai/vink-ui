import { CreateResourceWithYaml } from "@/components/create-resource-with-yaml"

export const vpcYaml = `
kind: Vpc
apiVersion: kubeovn.io/v1
metadata:
  name: example
spec:
  namespaces:
    - ns1
`

export default () => {
    return (
        <CreateResourceWithYaml data={vpcYaml} backout="/network/vpcs" />
    )
}
