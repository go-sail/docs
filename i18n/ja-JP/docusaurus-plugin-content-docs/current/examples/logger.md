---
sidebar_position: 2
---  
# ロガー  
本章ではロガーライブラリの使用方法について説明します。  

## はじめに  
ロガーコンポーネントは`uber-go/zap`ロギングライブラリのラッパーで、ビジネス機能を強化・拡張したものです。  
Go-Sailの起動時にロガーコンポーネントが有効化されている場合、自動的に初期化されます。その後、開発者は`sail`キーワードを通じて直接呼び出すことができ、内部の詳細を気にする必要はありません。  
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
## エクスポーター  
エクスポーターの役割は、ログを他の場所に転送することです。一般的に、エクスポーターは最適なパフォーマンスを提供するために内部で非同期に動作する必要があります。  
这是可选的，如果不启用，日志只会输出到本地文件。  
### Redisリスト(シングルインスタンス)  
`Exporter.Provider`オプションの値を`redis`に設定する必要があります。また、対応するRedis接続情報も設定する必要があります。  
### Redisリスト(クラスター)  
`Exporter.Provider`オプションの値を`redis-cluster`に設定する必要があります。また、対応するRedis接続情報も設定する必要があります。  
### Natsトピック  
`Exporter.Provider`オプションの値を`nats`に設定する必要があります。また、対応するNats接続情報も設定する必要があります。  
### Kafkaトピック  
`Exporter.Provider`オプションの値を`kafka`に設定する必要があります。また、対応するKafka接続情報も設定する必要があります。  
### その他  
上記のエクスポーターはGo-Sailの組み込み実装です。他のエクスポーターを使用したい場合は、"zapcore.WriteSyncer"を自身で実装することができます。  
## 使用例  
### 通常のログ出力  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger().Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### モジュールの指定  
ログファイルのモジュールを指定することは、ファイル名でログを分割することを意味します。ログが多く、機能ごとに分割する必要がある場合、この設定は非常に便利です。これは「ファイル名」フィールドと組み合わせて使用されます。例えば、「Filename」フィールドの値が「running.log」で、「Modules」の値の1つが「schedule」の場合、scheduleのファイル名は「running_schedule.log」となります。`sail.GetLogger()`メソッドを使用してモジュールのログ出力を指定できます。例：`sail.GetLogger("schedule")`。  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger("schedule").Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### シリアライズフィールド  
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
### その他  
その他のネイティブ呼び出し方法については、[uber-go/zap](https://github.com/uber-go/zap)の公式ドキュメントを参照してください。  