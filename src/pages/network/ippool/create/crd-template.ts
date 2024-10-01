export const ippoolYaml = `
apiVersion: kubeovn.io/v1
kind: IPPool
metadata:
  name: example
spec:
  subnet: ovn-default
  ips:
    - 10.16.0.201
    - 10.16.0.210/30
    - 10.16.0.220..10.16.0.230
  namespaces:
    - ns1
`
