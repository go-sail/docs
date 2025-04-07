---
sidebar_position: 3
---

# Components
This chapter explains what components are.

### Introduction
In the Go-Sail framework, Components generally refer to third-party component libraries, such as databases, Redis, logging libraries, etc.  
When Go-Sail starts up, one of the steps is to initialize these components sequentially according to the configuration file.  
These components will provide great convenience for subsequent business function development. At the same time, you don't need to worry about their underlying implementation details, as everything will be taken over by Go-Sail.  

### Getting Components  
After components are initialized, you can get the corresponding component instances through the `sail` keyword.  
For example:  
- Logger  
```go title="main.go" showLineNumbers  
sail.GetLogger()
```

- Database  
```go title="main.go" showLineNumbers  
dbr, dbw := sail.GetDB()

dbr := sail.GetDBR()

dbw := sail.GetDBW()
```  

- Redis    
```go title="main.go" showLineNumbers  
sail.GetRedis()
```  
:::tip  
`sail.GetXX` is safe to use throughout the entire business lifecycle (afterFunc).  
If you have any questions about the business lifecycle, please refer to the **[Lifecycle](./lifecycle.md)** chapter.  
:::  

:::tip  
It's important to note that the component instances maintained by Go-Sail are provided as singletons. Throughout the entire service lifecycle, the same component library will be the same instance. If you need to create new instances, you'll need to use the `NewXX` syntax sugar.
For example `sail.NewDB()`. Don't worry - while these operations are considered advanced behaviors, you can easily learn about their specific usage in subsequent articles.
:::

## Standalone Usage  
Generally speaking, the component libraries provided by Go-Sail are designed to be decoupled from the framework itself, so they support standalone usage by default.  
Taking logger as an example, you can install it separately using the `go get` command.  

### Installation  
```shell  
go get -u github.com/keepchen/go-sail/lib/logger
```  

### Usage  
```go title="main.go" showLineNumbers  
package main  

import "github.com/keepchen/go-sail/lib/logger"

func main() {
    InitLogger()
    logger.GetLogger().Info(...)
}

func InitLogger() {
    conf := logger.Conf{}
    logger.Init(conf, "http-server")
}

```  
