---
sidebar_position: 3
---

# 组件  
本章节阐述什么是组件。  

### 术语  
在Go-Sail框架中，Component一般是第三方组件库的统称，比如数据库、Redis、日志库等。  
当Go-Sail启动时，步骤之一是根据配置文件依次启动这些组件。  
这些组件将为后续业务功能开发提供极大的便利。 同时，你不需要关心它们底层的实现细节，一切都将由Go-Sail接管。  

### 获取  
组件初始化后，可以通过 `sail` 关键字获取对应的组件实例。  
例如：  
- 日志  
```go title="main.go" showLineNumbers  
sail.GetLogger()
```

- 数据库  
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
`sail.GetXX` 是安全的，可以在整个业务生命周期（afterFunc）中使用。  
如果您对业务生命周期有疑问，请查看 **[生命周期](./lifecycle.md)** 章节。
:::  

:::tip  
需要注意的是，Go-Sail维护的组件实例都是以单例的形态提供的，在整个服务生命周期中，同一组件库都会是同一个实例。如果你有创建新实例的需求，需要使用`NewXX`语法糖。
例如`sail.NewDB()`。请放轻松，虽然这些操作属于进阶行为，但你可以很容易的在后续的文章中了解具体用法。
:::

## 单独使用  
一般来讲，Go-Sail提供的组件库设计是与框架本身解耦的，因此默认支持单独使用。  
以logger来举例，你可以通过`go get`命令单独安装它。  

### 安装  
```shell  
go get -u github.com/keepchen/go-sail/lib/logger
```  

### 调用  
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
