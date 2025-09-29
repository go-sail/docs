---
sidebar_position: 1
---

# Control Plane
This section introduces what a control plane is.
## Introduction
The control plane is a component aggregation management method proposed by Go-Sail. It aims to simplify and shield the underlying implementation as much as possible, and provide developers with a clear and convenient calling method in an efficient aggregation manner.  
  
In previous versions, implementing a function may require developers to reference different component libraries or packages of Go-Sail, which is messy and obscure. However, this situation will gradually improve.  

Since `v3.0.6_rc5`, this concept has been enhanced.  

Taking the tool class as an example, in previous use cases, you usually need to write the following code:  
```go title="main.go" showLineNumbers  
import ( 
    "github.com/keepchen/go-sail/v3/utils"
    "github.com/keepchen/go-sail/v3/lib/jwt"
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    utils.RedisLocker().TryLock(...)
    schedule.NewJob(...).Withoutoverlapping().Every(...)
    jwt.SignWithMap(....)
}
```  
Starting from `v3.0.6_rc5`, you can directly use the various components mentioned above in a more compact way, like this:  
```go title="main.go" showLineNumbers  
import ( 
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.RedisLocker().TryLock(...)
    sail.Schedule(...).Withoutoverlapping().Every(...)
    sail.JWT().MakeToken(...)
}
```  