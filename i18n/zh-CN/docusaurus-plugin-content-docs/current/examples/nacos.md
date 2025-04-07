---
sidebar_position: 5
---  
# Nacos  
本章节将介绍Nacos如何使用。  
## 简介  
nacos组件是对`nacos-group/nacos-sdk-go/v2`的二次封装。  
该组件封装了一些最常用的方法，比如获取配置、监控配置、注册服务、卸载服务、获取健康实例等。  
## 使用方法  
### 初始化客户端  
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
### 获取配置  
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
### 监听配置  
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
### 注册服务  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    ok, err := nacos.RegisterService(groupName, serviceName, ip, port, metadata)
}
```  
### 下线服务  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
)

func main() {
    ok, err := nacos.UnregisterService(groupName, serviceName, ip, port)
}
```  
### 获取健康实例
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

### 其他  
更多原生调用方法请查看[nacos-group/nacos-sdk-go/v2](https://github.com/nacos-group/nacos-sdk-go)官方文档。  


