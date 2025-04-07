---
sidebar_position: 3
---  
# データベース  
本章ではデータベースコンポーネントの使用方法について説明します。  
## はじめに  
データベースコンポーネントは`gorm.io/gorm`のラッパーです。このコンポーネントはデータベース接続処理とログ処理のみをラップしており、その他の機能はネイティブ呼び出しのままです。  
gormの特徴により、mysql、postgresql、sqlserver、sqliteおよびclickhouseのデータベース操作をサポートしています。  
Go-Sailの起動時に有効化されている場合、データベースコンポーネントは自動的に初期化され、その後開発者はsailキーワードを通じて直接呼び出すことができます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    dbr, dbw := sail.GetDB()
    dbr := sail.GetDBR()
    dbw := sail.GetDBW()
    // highlight-end
}
```  
:::tip  
データベースコンポーネントは、読み取りと書き込みの2つのシナリオに基づいて、接続インスタンスを**読み取りインスタンス**と**書き込みインスタンス**に分けています。この設計は読み書き分離のシナリオで非常に有用です。もしビジネスで読み書き分離が必要ない場合は、読み取り設定と書き込み設定を同じ内容に設定することができます。  
:::  
## 使用例  
### 読み取りインスタンス  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbr := sail.GetDBR()
}
```
### 書き込みインスタンス  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbw := sail.GetDBW()
}
```  
### トランザクション  
データベーストランザクションを使用する場合は、予期しない状況を避けるために、トランザクション内の操作が**同一の接続インスタンス**で実行されることを確認する必要があります。  
:::tip  
これは正しい例です。  
```go title="main.go" showLineNumbers  
import (
    "gorm.io/gorm"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetDBW().Transaction(func(tx *gorm.DB) err error{
        err = tx.Model(...).Where(...).First(...).Error
        if err != nil {
            return err
        }
        err = tx.Model(...).Where(...).Updates(...).Error
        return err
    })
}
```  
:::  
:::danger  
これは誤った例です。  
```go title="main.go" showLineNumbers  
import (
    "gorm.io/gorm"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    tx := sail.GetDBR().Begin()
    sail.GetDBW().Model(...).Where(...).Updates(...).Error
    tx := sail.GetDBR().Commit()
}
```  
:::  
## 高度な使用法  
### 新しいインスタンス  
特定のシナリオでは、開発者が新しいデータベースインスタンスを個別に作成する必要がある場合があります。このような場合、Go-Sailが提供する新しいインスタンス作成のシンタックスシュガーを使用できます。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    conf := db.Conf{....}
    sail.NewDB(conf)
}
```  
:::tip  
新しいインスタンスはGo-Sailによって管理されなくなるため、開発者は接続のクローズやリリースなど、そのライフサイクルを自身で管理する必要があります。  
:::