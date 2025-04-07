---
sidebar_position: 10
---  
# Kafka  
This section will introduce how to use the Kafka component.  
## Introduction  
The Kafka component is a simple wrapper around the `segmentio/kafka-go` library, allowing developers to ignore connection details.  
When Go-Sail starts, if enabled, it will automatically initialize the Kafka component. After that, developers can directly call it using the `sail` keyword.  
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
## Usage  
### Others  
For more native methods, please refer to the official documentation of [segmentio/kafka-go](https://github.com/segmentio/kafka-go).  
## Advanced  
### New Instance  
In some specific scenarios, developers may need to create a new Kafka instance separately. In this case, you can use the syntactic sugar provided by Go-Sail to create a new instance.  
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
The new instance will no longer be managed by Go-Sail, so developers need to manage its lifecycle themselves, such as closing or releasing connections.  
:::