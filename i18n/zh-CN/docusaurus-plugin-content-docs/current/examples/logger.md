---
sidebar_position: 2
---  
# 日志  
本章节将介绍日志库项如何使用。  

## 简介  
Logger组件是对`uber-go/zap`日志库的二次封装，丰富和增强了业务功能。  
当Go-Sail启动时，如果启用，它将自动初始化日志组件。之后开发者就可以直接通过`sail`关键字来调用它，无须关心内部细节。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetLogger()
    // highlight-end
}
```  
## 导出器  
导出者的作用是将日志转移到其他地方。 一般来说，导出器应该在内部异步工作以提供最佳性能。  
这是可选的，如果不启用，日志只会输出到本地文件。  
### Redis列表(单实例)  
`Exporter.Provider`选项的值需要设置为`redis`。另外还需要设置相应的Redis连接信息。  
### Redis列表(集群)  
`Exporter.Provider`选项的值需要设置为`redis-cluster`。另外还需要设置相应的Redis连接信息。  
### Nats主题  
`Exporter.Provider`选项的值需要设置为`nats`。另外还需要设置相应的Nats连接信息。  
### Kafka主题  
`Exporter.Provider` 选项的值需要设置为`kafka`。另外还需要设置对应的Kafka连接信息。  
### 其他  
上述导出器是Go-Sail的内置实现。如果你想使用其他导出器，你可以自己实现“zapcore.WriteSyncer”。  
## 使用方法  
### 常规的  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger().Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### 指定模块  
指定日志文件模块，通俗地说，就是按照文件名来分割日志。 当日志较多且需要按功能划分时，此配置很有用。它将与“文件名”字段结合使用。假设“Filename”字段值为“running.log”，“Modules”的值之一为“schedule”，则schedule的文件名为“running_schedule.log”。你可以通过`sail.GetLogger()`方法指定模块的日志输入，如：`sail.GetLogger("schedule")`。  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger("schedule").Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### 序列化字段  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger("schedule").Error("looks like something went wrong", 
        zap.String("value", sail.MarshalInterfaceValue(anyValue)),
        zap.String("err", err.Error()))
}
```  
### 其他  
更多原生调用方法请查看[uber-go/zap](https://github.com/uber-go/zap)的官方文档。  