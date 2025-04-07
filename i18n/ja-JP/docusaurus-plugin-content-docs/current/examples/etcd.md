---
sidebar_position: 9
---  
# Etcd  
本章ではEtcdコンポーネントの使用方法について説明します。  
## はじめに  
Etcdコンポーネントは`go.etcd.io/etcd`ライブラリのシンプルなラッパーで、開発者が接続の詳細を気にすることなく、簡単な監視機能を提供します。  
Go-Sailの起動時にEtcdコンポーネントが有効化されている場合、自動的に初期化されます。その後、開発者は`sail`キーワードを通じて直接呼び出すことができます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetEtcdInstance()
    // highlight-end
}
```  
## 使用例  
### キーの監視  
```go title="main.go" showLineNumbers  
var fn = func(k, v []byte) {
    fmt.Printf("key: %s changed: %s\n", string(k), string(v))
}

func main() {
    // highlight-start
    watchChan := sail.GetEtcdInstance().Watch(ctx, key)
    for watchResp := range watchChan {
        for _, value := range watchResp.Events {
            fn(value.Kv.Key, value.Kv.Value)
        }
    }
    // highlight-end
}
```  
### その他  
その他のネイティブ呼び出し方法については、[go.etcd.io/etcd/client/v3](https://pkg.go.dev/go.etcd.io/etcd/client/v3)の公式ドキュメントを参照してください。  
## 高度な使用法  
### 新しいインスタンス  
特定のシナリオでは、開発者が新しいEtcdインスタンスを個別に作成する必要がある場合があります。このような場合、Go-Sailが提供する新しいインスタンス作成のシンタックスシュガーを使用できます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/etcd"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := etcd.Conf{....}
    sail.NewEtcd(conf)
}
```  
:::tip  
新しいインスタンスはGo-Sailによって管理されなくなるため、開発者は接続のクローズやリリースなど、そのライフサイクルを自身で管理する必要があります。  
:::

