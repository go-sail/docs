---
sidebar_position: 4
---  
# Redis  
本章ではRedisの使用方法について説明します。  
## はじめに  
Redisコンポーネントは`go-redis/redis/v8`ライブラリのラッパーです。このコンポーネントはRedisの接続処理とログ処理のみをラップしており、その他の機能は全てネイティブな呼び出しとなります。  
Go-Sailの起動時にRedisコンポーネントが有効化されている場合、自動的に初期化されます。その後、開発者は`sail`キーワードを通じて直接呼び出すことができます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedis()
    // highlight-end
}
```  
## 使用例
### 汎用クライアント
Redisはシングルインスタンス、クラスターなど様々なトポロジー構造に分かれていますが、`go-redis/redis/v8`は一般的なクライアント呼び出し方法を提供しており、これにより下層の違いを隠蔽して使用のハードルを下げることができます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedis().Get(ctx, key)
    // highlight-end
}
```  
接続タイプが明確な場合は、型アサーションまたは直接取得の方法で異なるタイプのクライアントインスタンスを取得できます。  
### 型アサーション  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
    redisLib "github.com/go-redis/redis/v8"
)

func main() {
    // highlight-start
    sail.GetRedis().(*redisLib.Client).Get(ctx, key)
    sail.GetRedis().(*redisLib.ClusterClient).Get(ctx, key)
    // highlight-end
}
```  
Go-Sailは異なるタイプのインスタンスを直接取得するためのシンタックスシュガーも提供しています。  
### シングルインスタンス  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedisStandalone().Get(ctx, key)
    // highlight-end
}
```  
### クラスター  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetRedisCluster().Get(ctx, key)
    // highlight-end
}
```  

### その他  
その他のネイティブな呼び出し方法については、[redis/go-redis/v8](https://github.com/redis/go-redis)の公式ドキュメントをご覧ください。  
## 高度な使用方法  
### 新しいインスタンス  
特定のシナリオでは、開発者が新しいRedisインスタンスを個別に作成する必要がある場合があります。このような場合、Go-Sailが提供する新しいインスタンス作成のシンタックスシュガーを使用できます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/redis"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := redis.Conf{....}
    sail.NewRedis(conf)
}
```  
:::tip  
新しいインスタンスはGo-Sailによって管理されなくなるため、開発者は接続のクローズやリリースなど、そのライフサイクルを自身で管理する必要があります。  
:::

