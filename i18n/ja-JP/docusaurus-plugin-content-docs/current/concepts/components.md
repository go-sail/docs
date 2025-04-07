---
sidebar_position: 3
---

# コンポーネント  
このセクションでは、コンポーネントとは何かについて説明します。  

### 用語  
Go-Sail フレームワークでは、コンポーネントは通常、データベース、Redis、ログ ライブラリなどのサードパーティ コンポーネント ライブラリの総称です。
Go-Sail が起動すると、構成ファイルに従ってこれらのコンポーネントを順番に起動する手順が 1 つあります。
これらのコンポーネントは、その後のビジネス機能の開発に大きな利便性をもたらします。同時に、基礎となる実装の詳細を気にする必要はなく、すべて Go-Sail によって処理されます。  

### 得る  
コンポーネントが初期化された後、`sail` キーワードを通じて対応するコンポーネント インスタンスを取得できます。  
例えば：  
- ログ  
```go title="main.go" showLineNumbers  
sail.GetLogger()
```

- データベース  
```go title="main.go" showLineNumbers  
dbr, dbw := sail.GetDB()

dbr := sail.GetDBR()

dbw := sail.GetDBW()
```  

- Redis    
```go title="main.go" showLineNumbers  
sail.GetRedis()
```  
:::tip  
`sail.GetXX` は安全であり、ビジネスライフサイクル全体 (afterFunc) で使用できます。  
ビジネス ライフサイクルについてご質問がある場合は、**[ライフサイクル](./lifecycle.md)** セクションを確認してください。  
:::  

:::tip  
Go-Sail によって管理されるコンポーネント インスタンスはシングルトンの形式で提供されることに注意してください。サービスのライフサイクル全体を通じて、同じコンポーネント ライブラリは同じインスタンスになります。新しいインスタンスを作成する必要がある場合は、`NewXX` 構文シュガーを使用する必要があります。
たとえば、`sail.NewDB()` です。これらの操作は高度な動作ですが、具体的な使い方は以降の記事で簡単に理解できますのでご安心ください。
:::

## 単独で使用  
一般的に、Go-Sail が提供するコンポーネント ライブラリはフレームワーク自体から分離されるように設計されているため、デフォルトでスタンドアロンの使用をサポートします。
logger を例にとると、`go get` コマンドを使用して個別にインストールできます。  

### インストール  
```shell  
go get -u github.com/keepchen/go-sail/lib/logger
```  

### 使用  
```go title="main.go" showLineNumbers  
package main  

import "github.com/keepchen/go-sail/lib/logger"

func main() {
    InitLogger()
    logger.GetLogger().Info(...)
}

func InitLogger() {
    conf := logger.Conf{}
    logger.Init(conf, "http-server")
}

```  
