---
sidebar_position: 4
---  
# Redis  
This section will introduce how to use Redis.  
## Introduction  
The Redis component is a secondary encapsulation of `go-redis/redis/v8`. This component only encapsulates Redis connection handling and log processing, while all other functionality remains as native calls.    
When Go-Sail starts, if enabled, it will automatically initialize the Redis component. After that, developers can directly call it using the `sail` keyword.  
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
## Usage  
### Universal Client  
Although Redis has multiple topology structures such as standalone instances and clusters, `go-redis/redis/v8` provides a universal client interface that abstracts away the underlying differences to lower the barrier to entry.  
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
If you can determine your connection type, you can obtain different types of client instances through type assertion or direct retrieval.  
### Type Assertion  
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
Go-Sail also provides syntactic sugar for directly obtaining different types of instances.  
### Standalone  
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
### Cluster  
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

### Others  
For more native methods, please refer to the official documentation of [redis/go-redis/v8](https://github.com/redis/go-redis).  
## Advanced  
### New Instance  
In some specific scenarios, developers may need to create a new Redis instance separately. In this case, you can use the syntactic sugar provided by Go-Sail to create a new instance.  
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
The new instance will no longer be managed by Go-Sail, so developers need to manage its lifecycle themselves, such as closing or releasing connections.  
:::

