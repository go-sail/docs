---
sidebar_position: 10
---  
# Kafka  
本章节将介绍Kafka组件如何使用。  
## 简介  
Kafka组件对是对`segmentio/kafka-go`库的简单封装，让开发者可以忽略连接细节。  
当Go-Sail启动时，如果启用，它将自动初始化Kafka组件。之后开发者就可以直接通过`sail`关键字来调用它。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    connections := sail.GetKafkaConnections()
    // highlight-end

    // highlight-start
    instance := sail.GetKafkaInstance()
    // highlight-end

    // highlight-start
    reader := sail.GetKafkaReader()
    // highlight-end

    // highlight-start
    writer := sail.GetKafkaWriter()
    // highlight-end
}
```  
## 使用方法  
### 其他  
更多原生调用方法请查看[segmentio/kafka-go](https://github.com/segmentio/kafka-go)的官方文档。  
## 进阶  
### 新实例  
在某些特定场景下，开发者可能需要单独创建一个新的Kafka实例，这个时候可以使用Go-Sail提供的创建新实例语法糖。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/kafka"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := kafka.Conf{....}
    sail.NewKafkaConnections(conf)
}
```  
:::tip  
新实例将不再被Go-Sail接管，因此，开发者需要自行管理其生命周期，例如连接的关闭或释放。
:::