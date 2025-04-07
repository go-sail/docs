---
sidebar_position: 4
---  
# Redis  
本章节将介绍Redis的使用方法。  
## 简介  
Redis组件是`go-redis/redis/v8`的二次封装。 该组件只封装了Redis的连接处理和日志处理，其余内容均为原生调用。    
当Go-Sail启动时，如果启用，它将自动初始化Redis组件。之后开发者可以直接通过`sail`关键字来调用。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedis()
    // highlight-end
}
```  
## 使用方法  
### 普遍的客户端  
尽管Redis分为单实例、集群等多种拓扑结构，但`go-redis/redis/v8`提供了较为普遍的客户端调用方式，这样可以屏蔽底层差异从而降低使用门槛。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedis().Get(ctx, key)
    // highlight-end
}
```  
如果你能明确你的连接类型，那么你通过断言或者是直接获取的方式获取不同类型的客户端实例。  
### 类型断言  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
    redisLib "github.com/go-redis/redis/v8"
)

func main() {
    // highlight-start
    sail.GetRedis().(*redisLib.Client).Get(ctx, key)
    sail.GetRedis().(*redisLib.ClusterClient).Get(ctx, key)
    // highlight-end
}
```  
Go-Sail也提供了直接获取不同类型实例的语法糖。  
### 单机  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedisStandalone().Get(ctx, key)
    // highlight-end
}
```  
### 集群  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedisCluster().Get(ctx, key)
    // highlight-end
}
```  

### 其他  
更多原生调用方法请查看[redis/go-redis/v8](https://github.com/redis/go-redis)的官方文档。  
## 进阶  
### 新实例  
在某些特定场景下，开发者可能需要单独创建一个新的Redis实例，这个时候可以使用Go-Sail提供的创建新实例语法糖。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/redis"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := redis.Conf{....}
    sail.NewRedis(conf)
}
```  
:::tip  
新实例将不再被Go-Sail接管，因此，开发者需要自行管理其生命周期，例如连接的关闭或释放。
:::

