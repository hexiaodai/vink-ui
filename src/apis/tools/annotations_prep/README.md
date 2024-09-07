# 自动生成 label 与 annotation

添加生成 label 与 annotation 工具，保留部分 istio 定义，参考 istio/api  与 istio/tools

## 规范
* name 必须是 **.kubevm.io/** 
* vink 中自定义 annotation 或 label 必须带 `.kubevm.io`


## 指令介绍
### 通过 main.go 程序
样例指令如下：
```bash
go run ./tools/annotations_prep/main.go --input ./apis/label/labels.yaml --output ./apis/label/labels.gen.go --html_output ./apis/label/labels.pb.html --collection_type label
go run ./tools/annotations_prep/main.go --input ./apis/annotation/annotations.yaml --output ./apis/annotation/annotations.gen.go --html_output ./apis/annotation/annotations.pb.html --collection_type annotation
```

### 安装
```bash
# 在 vink 项目下，并且位于 $GOPATH/src
go install $PWD/tools/annotations_prep
annotations_prep --input ./apis/label/labels.yaml --output ./apis/label/labels.gen.go --html_output ./apis/label/labels.pb.html --collection_type label
annotations_prep --input ./apis/annotation/annotations.yaml --output ./apis/annotation/annotations.gen.go --html_output ./apis/annotation/annotations.pb.html --collection_type annotation
```

### 参数

* `--collection_type` string Output type for the generated collection. Allowed values are 'annotation' or 'label'. (
  default "annotation")
* `--input` string Input YAML file to be parsed.
* `--output` string Output Go file to be generated.
* (optional) `--html_output` string Output HTML file to be generated.
* (optional) `--help`

## YAML 模板
```yaml
  - name: makkubevm.io/managed
    featureStatus: Alpha
    description: Set to `vink` if the vink Controller will reconcile the resource.
    hidden: true
    deprecated: false
    resources:
      - Any
```

* featureStatus: 	Alpha | Beta | Stable 
