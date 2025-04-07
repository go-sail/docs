---
sidebar_position: 10
---  
# Kafka  
本章ではKafkaコンポーネントの使用方法について説明します。  
## はじめに  
Kafkaコンポーネントは`segmentio/kafka-go`ライブラリのシンプルなラッパーで、開発者が接続の詳細を気にすることなく使用できます。  
Go-Sailの起動時にKafkaコンポーネントが有効化されている場合、自動的に初期化されます。その後、開発者は`sail`キーワードを通じて直接呼び出すことができます。  
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
## 使用例  
### その他  
その他のネイティブ呼び出し方法については、[segmentio/kafka-go](https://github.com/segmentio/kafka-go)の公式ドキュメントを参照してください。  
## 高度な使用法  
### 新しいインスタンス  
特定のシナリオでは、開発者が新しいKafkaインスタンスを個別に作成する必要がある場合があります。このような場合、Go-Sailが提供する新しいインスタンス作成のシンタックスシュガーを使用できます。  
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
新しいインスタンスはGo-Sailによって管理されなくなるため、開発者は接続のクローズやリリースなど、そのライフサイクルを自身で管理する必要があります。  
:::