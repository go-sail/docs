---
sidebar_position: 9
---  
# Etcd  
This section will introduce how to use the Etcd component.  
## Introduction  
The Etcd component is a simple wrapper around the `go.etcd.io/etcd` library, allowing developers to ignore connection details and providing basic key watching functionality.  
When Go-Sail starts, if the Etcd component is enabled, it will automatically initialize the Etcd component. After that, developers can directly call it using the `sail` keyword.  
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
## Usage  
### Watch Key  
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
### Others  
For more native methods, please refer to the official documentation of [go.etcd.io/etcd/client/v3](https://pkg.go.dev/go.etcd.io/etcd/client/v3).  
## Advanced  
### New Instance  
In some specific scenarios, developers may need to create a new Etcd instance separately. In this case, you can use the syntactic sugar provided by Go-Sail to create a new instance.  
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
The new instance will no longer be managed by Go-Sail, so developers need to manage its lifecycle themselves, such as closing or releasing connections.  
:::

