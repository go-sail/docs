---
sidebar_position: 3
---

# デプロイメント  
本章では、コードのビルドとサービスのデプロイメントについて説明します。  
## はじめに  
機能開発が一定の段階に達すると、コードをビルドし、ビルドされた成果物をサーバーにデプロイして実行します。通常、このプロセスをリリースまたはデプロイメントと呼びます。  
## ビルド  
まず、ビルドについて説明します。  
Go言語のビルドは比較的シンプルです。これはGo言語のクロスプラットフォーム特性のおかげであり、ビルド完了後の成果物はバイナリファイルの形式で存在します。  
### コンパイル  
最も単純なコンパイルコマンドは次のとおりです：  
```shell  
go build
```  
通常、プロジェクトをコンパイルする際には、出力ファイル名を指定する必要があります：  
```shell  
go build -o ~/path/to/artifacts/[name]
```  
### クロスコンパイル  
同様に、異なるプラットフォームのアーキテクチャ向けにビルドする必要がある場合があります。その場合はクロスコンパイルを使用する必要があります。  
クロスコンパイルについて、Goコンパイラは環境変数を指定するだけという非常にシンプルな操作方法を提供しています。  

例えば、MacOSプラットフォームでLinuxプラットフォーム向けの成果物をビルドしたい場合：  
```shell  
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o ~/path/to/artifacts/[name]
```  
### コンパイル時の変数注入  
時には、コンパイル段階で成果物に追加情報を注入したい場合があります。例えば、バージョン番号やビルド時間などの一般的な情報です。このような場合、`-ldflags`オプションを使用してこの目的を達成できます。  
まず、バージョン情報を出力するファイルを作成しましょう：  
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

// PrintVersion バージョン情報を出力する
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
次に、コンパイルのコマンドライン引数を指定します：  
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
上記のコマンドは、バージョン情報が注入されたビルド成果物を作成します。  
注意：正常に動作させるには、Gitの環境やファイルがバージョン管理されているなどの前提条件が必要です。  
:::

## デプロイメント  
Go言語でビルドされた成果物は実行可能ファイルで、Windows環境では.exe、LinuxとMacOS環境ではバイナリ実行可能ファイルとなります。  
したがって、Windowsではダブルクリック、Linuxでは`./name`で実行できます。  
実際のサービス環境では、特にクラウドサーバー環境では、状況はやや複雑になります。ここでは、一般的な2つの方法を簡単に紹介します：`systemd`と`Dockerコンテナ`です。  
### Systemd  
SystemdはLinuxのシステムおよびサービスマネージャーで、`Systemctl`コマンドで制御・管理できます。以下に設定例を示します：  
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
この設定ファイルを`/usr/lib/systemd/system/`などのインストール場所に配置します。その後、`systemd`をリロードしてサービスを起動します：  
```shell  
sudo systemctl daemon-reload  

sudo systemctl enable apiserver  

sudo systemctl start apiserver

sudo systemctl status apiserver
```  

### Dockerコンテナ
Dockerコンテナは現在非常に人気のあるサービスデプロイメントソリューションです。以下にDockerfileのビルド例を示します：  
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
上記のDockerfileはマルチステージビルドを使用しており、最終的なイメージサイズを大幅に削減できます。  
:::  
dockerビルドコマンドを使用してビルドします：  
```shell  
docker build -t go-sail/go-sail:v1 .
```  
その後、dockerコマンドを使用してサービスを起動できます。  
もちろん、`docker compose`を使用してサービスを管理することもできます。以下にdocker-compose.yamlの例を示します：  
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
次に、docker composeコマンドを使用してサービスを起動します：  
```shell  
docker compose up -d
```  
:::tip  
イメージとしてビルドされると、サービスはコンテナ化され、Kubernetes上で実行できるようになります。  
:::