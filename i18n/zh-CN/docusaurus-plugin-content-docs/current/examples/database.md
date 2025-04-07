---
sidebar_position: 3
---  
# 数据库  
本章节介绍数据库组件如何使用。  
## 简介  
数据库组件是`gorm.io/gorm`的二次封装。该组件只封装了数据库的连接处理和日志处理，其余内容均为原生调用。
得益于gorm的特性，数据库操作支持mysql、postresql、sqlserver、sqlite和clickhouse。  
当Go-Sail启动时，如果启用，它将自动初始化数据库组件。之后开发者可以直接通过sail关键字来调用。    
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
数据库组件根据读和写两种场景，将连接实例分为**读实例**和**写实例**。这个方案在读写分离的场景下非常有用。如果你的业务不需要读写分离，你可以将读配置和写配置设置为相同的内容。  
:::  
## 使用方法  
### 读实例  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbr := sail.GetDBR()
}
```
### 写实例  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbw := sail.GetDBW()
}
```  
### 事务  
如果你要使用数据库事务，那么你应该确保事务中的操作应在**同一连接实例**上完成，以避免出现意外情况。  
:::tip  
这是一个正确的示例。  
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
这是一个错误的示例。  
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
## 进阶  
### 新实例  
在某些特定场景下，开发者可能需要单独创建一个新的数据库实例，这个时候可以使用Go-Sail提供的创建新实例语法糖。  
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
新实例将不再被Go-Sail接管，因此，开发者需要自行管理其生命周期，例如连接的关闭或释放。
:::