---
sidebar_position: 3
---

# 部署  
本章节将介绍代码构建与服务部署。  
## 简介  
当功能开发到一定阶段，我们会对代码进行构建，并且会将构建好的成品部署到服务器上运行起来，通常我们把这个过程成为发布或者发版。  
## 构建  
首先，我们介绍一下构建。  
Go语言的构建相对简单，这要得益于Go语言跨平台的特性，并且构建完成后成品是以二进制文件的形式存在的。  
### 编译  
最简单的编译指令便是：  
```shell  
go build
```  
通常，我们对某个工程进行编译的时候，需要指定输出的文件名称：  
```shell  
go build -o ~/path/to/artifacts/[name]
```  
### 交叉编译  
同样的，在一些时候，我们需要为不同平台的架构打包对应的成品，这时候需要使用交叉编译。  
关于交叉编译，Go编译器提供了非常简单的操作方式，即指定环境变量即可。  

例如，我在MacOS平台想要构建Linux平台的成品：  
```shell  
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ~/path/to/artifacts/[name]
```  
### 编译时变量注入  
有些时候，我们想要在编辑阶段，将一些额外信息注入到成品中。例如比较常见的版本号、构建时间等等。这个时候，我们可以用到`-ldflags`指令为我们达成此目的。  
首先，让我们创建一个打印版本信息的文件：  
```go title="main.go" showLineNumbers  
package main

import (
	"bytes"
	"fmt"
	"runtime"
	"strings"
	"text/template"
)

var (
	appName   = "app"
	version   = "major.minor.patch"
	branch    = "git/branch"
	revision  = "git/revision"
	buildDate = "yyyy-mm-dd hh:mm:ss"
	goVersion = runtime.Version()
)

const versionInfoTmpl = `
{{.program}}, version: {{.version}}
(branch: {{.branch}}; revision: {{.revision}})
  build date:   {{.buildDate}}
  go version:   {{.goVersion}}
`

// PrintVersion 打印版本信息
func PrintVersion() {
	m := map[string]string{
		"program":   appName,
		"version":   version,
		"branch":    branch,
		"revision":  revision,
		"buildDate": buildDate,
		"goVersion": goVersion,
	}

	tmpl, err := template.Must(template.New("version"), nil).Parse(versionInfoTmpl)
	if err != nil {
		panic(err)
	}

	buf := bytes.Buffer{}
	if err := tmpl.Execute(&buf, m); err != nil {
		panic(err)
	}

	fmt.Println(strings.TrimSpace(buf.String()))
}

func main() {
    ...
    PrintVersion()
    ...
}
```  
然后我们指定编译的命令行参数：  
```shell  
PACKAGE=name
PREFIX=$(shell pwd)
COMMIT_ID=$(shell git rev-parse --short HEAD)
VERSION=$(shell git describe --tags || echo "v0.0.0")
VERSION_IMPORT_PATH=${PACKAGE}
BUILD_TIME=$(shell date '+%Y-%m-%dT%H:%M:%S%Z')
VCS_BRANCH=$(shell git symbolic-ref --short -q HEAD)

BUILD_ARGS = \
    -ldflags "-X $(VERSION_IMPORT_PATH).appName=$(PACKAGE) \
    -X $(VERSION_IMPORT_PATH).version=$(VERSION) \
    -X $(VERSION_IMPORT_PATH).revision=$(COMMIT_ID) \
    -X $(VERSION_IMPORT_PATH).branch=$(VCS_BRANCH) \
    -X $(VERSION_IMPORT_PATH).buildDate=$(BUILD_TIME)"

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build $(BUILD_ARGS) -o ~/path/to/artifacts/[name]
```  
:::tip  
上面的指令将为你构建一个注入了版本信息的成品。  
注意，要让其正常工作，需要有前提条件，例如git环境、你的文件进行了版本控制管理。
:::

## 部署  
因为Go语言构建出的成品是可执行文件，在Windows环境是.exe，在Linux和MacOS环境是二进制可执行文件。
因此，Windows上双击，Linux上`./name`即可运行。  
在实际的服务环境中，情况会稍微复杂一些，特别是在云服务器环境。这里简单介绍较为流行的两种方式：`systemd`和`docker容器`。  
### Systemd  
Systemd是Linux的系统和服务管理器，可以用`Systemctl`命令进行控制管理。下面给出一个对应的配置示例：  
```service title="apiserver.service" showLineNumbers  
[Unit]
Description=API Server
After=network.target network-online.target
Requires=network-online.target

[Service]
User=root
Group=root
ExecStart=/usr/bin/go-sail
ExecReload=/usr/bin/go-sail
KillMode=mixed
KillSignal=SIGQUIT
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=4096
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE
Restart=always

[Install]
WantedBy=multi-user.target
```  
将此配置文件放到安装位置，例如`/usr/lib/systemd/system/`。然后重新加载`systemd`并启动服务：  
```shell  
sudo systemctl daemon-reload  

sudo systemctl enable apiserver  

sudo systemctl start apiserver

sudo systemctl status apiserver
```  

### Docker容器  
Docker容器也是当下十分流行的服务部署方案。下面给出一个Dockerfile构建示例：  
```Dockerfile title="Dockerfile" showLineNumbers  
FROM golang:1.20 AS builder

ARG COMMIT_ID
ARG VERSION=""
ARG VCS_BRANCH=""
ARG GRPC_STUB_REVISION=""
ARG PROJECT_NAME=vastness
ARG DOCKER_PROJECT_DIR=/build
ARG EXTRA_BUILD_ARGS=""
ARG GOCACHE=""
ARG GOSUMDB=off

WORKDIR $DOCKER_PROJECT_DIR
COPY . $DOCKER_PROJECT_DIR

ENV GOPROXY=$GOPROXY
ENV GOSUMDB=$GOSUMDB

RUN mkdir -p /output \
    && make build -e GOCACHE=$GOCACHE \
    -e COMMIT_ID=$COMMIT_ID -e OUTPUT_FILE=/output/go-sail \
    -e VERSION=$VERSION -e VCS_BRANCH=$VCS_BRANCH -e EXTRA_BUILD_ARGS=$EXTRA_BUILD_ARGS

FROM keepchen/alpine-with-tzdata

ENV TZ=Asia/Shanghai

COPY --from=builder /output/go-sail /usr/bin/go-sail

CMD go-sail
```  
:::tip  
上述Dockerfile文件使用了多阶段构建，可以极大幅度的减小最终的镜像体积。  
:::  
使用docker构建指令进行构建：  
```shell  
docker build -t go-sail/go-sail:v1 .
```  
之后，使用docker指令即可启动服务。  
当然你也可以使用`docker compose`来管理你的服务，下面给出一个docker-compose.yaml的示例：  
```yaml title="docker-compose.yaml" showLineNumbers  
version: "3"

services:
  go-sail:
    image: "go-sail/go-sail:v1"
    container_name: go-sail
    environment:
      - Key=Value
    volumes:
      - ./logs:/logs
    restart: always
    ports:
      - "8080:8080"
```  
接下来，使用docker compose指令将服务运行起来：  
```shell  
docker compose up -d
```  
:::tip  
构建成镜像后，服务将具备容器化的能力，可以将服务运行在Kubernetes之上。
:::