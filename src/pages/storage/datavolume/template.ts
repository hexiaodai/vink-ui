export const dataVolumYaml = `
apiVersion: cdi.kubevirt.io/v1beta1
kind: DataVolume
metadata:
  name: ""
  namespace: ""
  labels: {}
  annotations:
    cdi.kubevirt.io/storage.bind.immediate.requested: "true"
spec:
  pvc:
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: ""
    storageClassName: local-path
  source: {}
`
