---
sidebar_position: 1
---

# コントロールプレーン
本章ではコントロールプレーンとは何かについて説明します。
## はじめに
コントロールプレーンは、Go-Sailが提案するコンポーネント集約管理手法です。これは、可能な限り基盤となる実装を簡素化・隠蔽し、開発者に対して効率的な集約方式で明確かつ便利な呼び出し方法を提供することを目的としています。

以前のバージョンでは、ある機能を実装する際にGo-Sailの異なるコンポーネントライブラリやパッケージを参照する必要があり、煩雑で分かりにくいものでした。しかし、この状況は徐々に改善されています。

`v3.0.6_rc5`以降、このコンセプトはさらに強化されました。

ツール系のクラスを例に挙げると、従来の利用方法では通常、次のようなコードを書く必要がありました：
```go title="main.go" showLineNumbers  
import ( 
    "github.com/keepchen/go-sail/v3/utils"
    "github.com/keepchen/go-sail/v3/lib/jwt"
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    utils.RedisLocker().TryLock(...)
    schedule.NewJob(...).Withoutoverlapping().Every(...)
    jwt.SignWithMap(....)
}
```  
`v3.0.6_rc5`以降、上記の各コンポーネントをより簡潔に直接利用できるようになりました。例えば次のように記述できます：  
```go title="main.go" showLineNumbers  
import ( 
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.RedisLocker().TryLock(...)
    sail.Schedule(...).Withoutoverlapping().Every(...)
    sail.JWT().MakeToken(...)
}
```  