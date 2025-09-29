---
sidebar_position: 1
---

# 控制平面
本章节将介绍什么是控制平面。
## 简介
控制平面是 Go-Sail 提出的一种组件聚合管理方式。它旨在尽可能简化和屏蔽底层实现，并以高效聚合的方式为开发者提供清晰、便捷的调用方式。

在以往的版本中，实现某个功能时，开发者可能需要引用 Go-Sail 的不同组件库或包，使用起来较为繁琐且不直观。不过，这种情况正在逐步改善。

自 `v3.0.6_rc5` 版本起，这一理念得到了进一步强化。

以工具类为例，过去的用法通常需要编写如下代码：
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
自 `v3.0.6_rc5` 版本起，上述各个组件可以以更简洁的方式直接使用，如下所示：  
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