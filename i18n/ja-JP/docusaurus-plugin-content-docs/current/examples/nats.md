---
sidebar_position: 6
---  
# Nats  
この章では、Natsの使用方法について説明します。  
## はじめに  
Natsコンポーネントは`nats-io/nats.go`ライブラリのラッパーです。  
Go-Sailの起動時にNatsコンポーネントが有効化されている場合、自動的に初期化されます。その後、開発者は`sail`キーワードを通じて直接呼び出すことができます。  
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
## 使用例  
### パブリッシュ  
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
### サブスクライブ    
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

### その他  
その他のネイティブな呼び出し方法については、[nats-io/nats.go](https://github.com/nats-io/nats.go)の公式ドキュメントをご覧ください。  
## 高度な使用方法  
### 新しいインスタンス  
特定のシナリオでは、開発者が新しいNatsインスタンスを個別に作成する必要がある場合があります。このような場合、Go-Sailが提供する新しいインスタンス作成のシンタックスシュガーを使用できます。  
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
新しいインスタンスはGo-Sailによって管理されなくなるため、開発者は接続のクローズやリリースなど、そのライフサイクルを自身で管理する必要があります。  
:::


