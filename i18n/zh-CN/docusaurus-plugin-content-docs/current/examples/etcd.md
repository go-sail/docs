---
sidebar_position: 9
---  
# Etcd  
本章节将介绍Etcd组件如何使用。  
## 简介  
Etcd组件对是对`go.etcd.io/etcd`库的简单封装，允许开发者忽略连接细节并提供简单的监听关键功能。  
当Go-Sail启动时，如果启用Etcd组件，它将自动初始化Etcd组件。之后开发者就可以直接通过`sail`关键字来调用它。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetEtcdInstance()
    // highlight-end
}
```  
## 使用方法  
### 监听Key  
```go title="main.go" showLineNumbers  
var fn = func(k, v []byte) {
    fmt.Printf("key: %s changed: %s\n", string(k), string(v))
}

func main() {
    // highlight-start
    watchChan := sail.GetEtcdInstance().Watch(ctx, key)
    for watchResp := range watchChan {
        for _, value := range watchResp.Events {
            fn(value.Kv.Key, value.Kv.Value)
        }
    }
    // highlight-end
}
```  
### 其他  
更多原生调用方法请查看[go.etcd.io/etcd/client/v3](https://pkg.go.dev/go.etcd.io/etcd/client/v3)的官方文档。  
## 进阶  
### 新实例  
在某些特定场景下，开发者可能需要单独创建一个新的Etcd实例，这个时候可以使用Go-Sail提供的创建新实例语法糖。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/etcd"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := etcd.Conf{....}
    sail.NewEtcd(conf)
}
```  
:::tip  
新实例将不再被Go-Sail接管，因此，开发者需要自行管理其生命周期，例如连接的关闭或释放。
:::

