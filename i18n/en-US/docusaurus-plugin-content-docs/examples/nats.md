---
sidebar_position: 6
---  
# Nats  
This section will introduce how to use Nats.  
## Introduction  
The nats component is a secondary encapsulation of `nats-io/nats.go`.  
When Go-Sail starts, if enabled, it will automatically initialize the Nats component. After that, developers can directly call it through the `sail` keyword.  
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
## Usage  
### Publish  
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
### Subscribe  
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

### Others  
For more native usage methods, please refer to the official documentation of [nats-io/nats.go](https://github.com/nats-io/nats.go).  
## Advanced  
### New Instance  
In some specific scenarios, developers may need to create a new Nats instance separately. In this case, you can use the syntax sugar provided by Go-Sail to create a new instance.  
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
The new instance will no longer be managed by Go-Sail, so developers need to manage its lifecycle themselves, such as closing or releasing connections.
:::


