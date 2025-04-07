---
sidebar_position: 6
---  
# Nats  
本章节将介绍Nats如何使用。  
## 简介  
nats组件是`nats-io/nats.go`的二次封装。  
当Go-Sail启动时，如果启用，它将自动初始化Nats组件。 之后开发者就可以直接通过`sail`关键字来调用它。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetNats()
    // highlight-end
}
```    
## 使用方法  
### 发布  
```go title="main.go" showLineNumbers  
import (
    natsLib "github.com/nats-io/nats.go"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    stream, err := sail.GetNats().JetStream(natsLib.PublishAsyncMaxPending(256))

    if err != nil {
        panic(fmt.Errorf("initial nats failed: %v", err))
    }

    natsConfig := &natsLib.StreamConfig{
        Name:      "streamName",
        Subjects:  []string{"subject.>"},
        Retention: natsLib.WorkQueuePolicy,
        Discard:   natsLib.DiscardOld,
        Storage:   natsLib.FileStorage,
        Replicas:  3,
    }

    info, err := stream.AddStream(natsConfig)

    subject := fmt.Sprintf("subject.%d", 0)
    if err != nil {
        fmt.Println("[STREAM] add stream error:", err.Error(), info)
    } else {
        // highlight-start
        pubAck, pushErr := stream.Publish(subject, []byte(`{}`))
        // highlight-end
        fmt.Printf("[STREAM] test publish ACK: %d, error: %v\n", pubAck.Sequence, pushErr)
    }
}
```  
### 订阅  
```go title="main.go" showLineNumbers  
import (
    natsLib "github.com/nats-io/nats.go"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    stream, err := sail.GetNats().JetStream(natsLib.PublishAsyncMaxPending(256))

    if err != nil {
        panic(fmt.Errorf("initial nats failed: %v", err))
    }

    natsConfig := &natsLib.StreamConfig{
        Name:      "streamName",
        Subjects:  []string{"subject.>"},
        Retention: natsLib.WorkQueuePolicy,
        Discard:   natsLib.DiscardOld,
        Storage:   natsLib.FileStorage,
        Replicas:  3,
    }

    info, err := stream.AddStream(natsConfig)

    // highlight-start
    cc := &natsLib.ConsumerConfig{
        Durable: "consumerName", 
        AckPolicy: natsLib.AckExplicitPolicy, 
        FilterSubject: "",
    }
    _, err := stream.AddConsumer("streamName", cc)
    // highlight-end

    // highlight-start
    sub, err := stream.PullSubscribe("filterSubject", "consumerName", 
                                natsLib.Bind("streamName", "consumerName"))
    // highlight-end
    if err != nil {
        panic(err)
    }

    for {
        msgs, _ := sub.Fetch(1, natsLib.MaxWait(5*time.Second))
        for _, msg := range msgs {
            ...
            _ = msg.AckSync()
            ...
        }
    }
}
```  

### 其他  
更多原生调用方法请查看[nats-io/nats.go](https://github.com/nats-io/nats.go)官方文档。  
## 进阶  
### 新实例  
在某些特定场景下，开发者可能需要单独创建一个新的Nats实例，这个时候可以使用Go-Sail提供的创建新实例语法糖。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nats"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := nats.Conf{....}
    sail.NewNats(conf)
}
```  
:::tip  
新实例将不再被Go-Sail接管，因此，开发者需要自行管理其生命周期，例如连接的关闭或释放。
:::


