---
sidebar_position: 3
---  
# Database  
This section introduces how to use the database component.  
## Introduction  
The database component is a secondary encapsulation of `gorm.io/gorm`. This component only encapsulates database connection handling and log processing, while all other functionalities remain as native calls.  
Thanks to gorm's features, database operations support MySQL, PostgreSQL, SQL Server, SQLite and ClickHouse.  
When Go-Sail starts, if enabled, it will automatically initialize the database component. After that, developers can directly call it through the sail keyword.    
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
The database component divides connection instances into **read instances** and **write instances** based on read and write scenarios. This solution is very useful in read-write separation scenarios. If your business doesn't require read-write separation, you can set the read and write configurations to be identical.  
:::  
## Usage  
### Read Instance  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbr := sail.GetDBR()
}
```
### Write Instance  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    dbw := sail.GetDBW()
}
```  
### Transaction  
If you want to use database transactions, you should ensure that operations within the transaction are performed on the **same connection instance** to avoid unexpected situations.  
:::tip  
This is a correct example.  
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
This is an incorrect example.  
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
## Advanced  
### New Instance  
In some specific scenarios, developers may need to create a new database instance separately. In this case, you can use the syntactic sugar provided by Go-Sail to create a new instance.  
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
The new instance will no longer be managed by Go-Sail, so developers need to manage its lifecycle themselves, such as closing or releasing connections.  
:::