---
sidebar_position: 5
---  
# Nacos  
本章ではNacosの使用方法について説明します。  
## はじめに  
Nacosコンポーネントは`nacos-group/nacos-sdk-go/v2`ライブラリのラッパーです。  
このコンポーネントは、設定の取得、設定の監視、サービスの登録、サービスの登録解除、正常なインスタンスの取得など、最も一般的に使用されるメソッドをラップしています。  
## 使用例  
### クライアントの初期化  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    // highlight-start
    nacos.InitClient("appName", "endpoints", "namespace id")
    // highlight-end
}
```  
### 設定の取得  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    var conf = &sailConfig.Config{}
    // highlight-start
    err := nacos.GetConfig(group, dataID, conf, "yaml")
    // highlight-end
}
```  
### 設定の監視  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    var conf = &sailConfig.Config{}
    // highlight-start
    callback := func(namespace, group, dataId, data string) {
        err = nacos.ParseConfig([]byte(data), conf, "yaml")
        if err != nil {
            fmt.Printf("<Nacos> listen config {%s:%s} change,but can't be unmarshal: %s\n", group, dataId, err.Error())
            return
        }
    }
    // highlight-end

    // highlight-start
    //listen config if it changed
    err = nacos.ListenConfigWithCallback(group, dataID, callback)
    // highlight-end
    if err != nil {
        panic(err)
    }
}
```  
### サービスの登録  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    ok, err := nacos.RegisterService(groupName, serviceName, ip, port, metadata)
}
```  
### サービスの登録解除  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    ok, err := nacos.UnregisterService(groupName, serviceName, ip, port)
}
```  
### 正常なインスタンスの取得  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    // highlight-start
    serviceUrl := nacos.GetHealthyInstanceUrl(group, serviceName, sail.GetLogger())
    // highlight-end
    if len(serviceUrl) == 0 {
        sail.GetLogger().Warn("no healthy instances")
        return ""
    }
}
```  

### その他  
より詳細なネイティブな呼び出し方法については、[nacos-group/nacos-sdk-go/v2](https://github.com/nacos-group/nacos-sdk-go)の公式ドキュメントをご覧ください。  


