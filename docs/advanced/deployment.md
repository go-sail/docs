---
sidebar_position: 3
---

# Deployment
This chapter will introduce code building and service deployment.  
## Introduction
When feature development reaches a certain stage, we will build the code and deploy the built artifacts to run on servers. This process is usually called release or deployment.
## Building
First, let's introduce the build process.  
Go's build process is relatively simple, thanks to its cross-platform capabilities. After building, the final product exists as a binary file.  
### Building Binary
The simplest build command is:  
```shell  
go build
```  
Usually, when compiling a project, we need to specify the output filename:  
```shell  
go build -o ~/path/to/artifacts/[name]
```  
### Cross-Platform Compilation
Similarly, sometimes we need to build artifacts for different platform architectures, which requires cross-compilation.  
For cross-compilation, the Go compiler provides a very simple approach - just specify environment variables.  

For example, if I want to build Linux artifacts on a MacOS platform:  
```shell  
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ~/path/to/artifacts/[name]
```  
### Variable Injection During Build
Sometimes, we want to inject additional information into the artifacts during the build phase, such as common details like version numbers and build timestamps. In these cases, we can use the `-ldflags` directive to achieve this purpose.  
First, let's create a file to print version information:  
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

// PrintVersion prints version information
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
Then we specify the compilation command line arguments:
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
The above command will build a binary with injected version information.
Note that for this to work properly, there are prerequisites such as having a git environment and your files being under version control.
:::

## Deployment
Since Go builds executables - .exe files on Windows and binary executables on Linux and MacOS environments.
Therefore, you can run it by double-clicking on Windows, or using `./name` on Linux.
In actual service environments, things can be a bit more complex, especially in cloud server environments. Here we'll briefly introduce two popular deployment methods: `systemd` and `Docker containers`.
### Systemd  
Systemd is Linux's system and service manager that can be controlled using the `Systemctl` command. Here's a configuration example:  
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
Place this configuration file in the installation location, such as `/usr/lib/systemd/system/`. Then reload `systemd` and start the service:  
```shell  
sudo systemctl daemon-reload  

sudo systemctl enable apiserver  

sudo systemctl start apiserver

sudo systemctl status apiserver
```  

### Docker Containers
Docker containers are also a very popular service deployment solution today. Here's an example of building with a Dockerfile:  
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
The above Dockerfile uses multi-stage builds, which can significantly reduce the final image size.
:::  
Build the image using the docker build command:  
```shell  
docker build -t go-sail/go-sail:v1 .
```  
Then, use the docker command to start the service.  
You can also use `docker compose` to manage your service. Here's an example docker-compose.yaml file:  
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
Next, use the docker compose command to start the service:  
```shell  
docker compose up -d
```  
:::tip  
After building the image, the service will be containerized and can be deployed on Kubernetes.
:::