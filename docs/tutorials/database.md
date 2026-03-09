---
sidebar_position: 4
---  
# Database    
This chapter will introduce how to interacts with a database in Go-Sail.  

## Introduction  
Almost all modern web applications interact with databases. Go-Sail uses GORM as its database operation layer engine, making it easy to connect to various types of databases.  

Currently, Go-Sail provides built-in configurations for the following databases, and callers can access them using simple API syntax without worrying about the underlying details.  

- MySQL / MariaDB
- PostgreSQL
- SQLite
- SQL Server  
- Clickhouse  

In previous chapters, we implemented the login interface, but the username and password were rigid, hard-coded. Now, we'll begin interacting with the database.

:::tip  
The following code uses a MySQL database as an example.
:::  

## Declaring Models  
```go title="main.go" showLineNumbers  
package main

type User struct {
    Username string `gorm"column:username;type:varchar(100);NOT NULL;comment:username"`
    Password string `gorm"column:password;type:varchar(1024);NOT NULL;comment:password"`
}

func (User) TableName() string {
	return "users"
}
```  

## Configuration    
Go-Sail's behavior is configuration-driven; to connect to the database, you first need to configure the database connection information. Looking back at the code we wrote in the quick start section, we declared an empty configuration. Now, we'll populate this configuration as needed.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    conf = &config.Config{
        // highlight-start
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
        },
        // highlight-end
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }

            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
When the service starts, since the configuration specifies that the database component needs to be enabled and the database driver (type) is MySQL, Go-Sail will follow the configuration, initialize the database component, and then it can be used globally.  

## Running SQL Queries  
Once the database connection is successful and the database components are ready, we can use API syntax to call the database components to perform operations such as queries.  

Taking the example above, instead of hard-coding, we query the user table in the database to see if a user exists, and further compare the password entered by the user with the password stored in the database.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

type User struct {
    Username string `gorm"column:username;type:varchar(100);NOT NULL;comment:username"`
    Password string `gorm"column:password;type:varchar(1024);NOT NULL;comment:password"`
}

func (User) TableName() string {
	return "users"
}

var (
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            // highlight-start
            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }
            // highlight-end
            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
            userGroup.GET("/balance", ...).
                    GET("/info", ...).
                    GET("/logout", ...)
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
## Read and Write Connections  
As you can see in the configuration section above, we've configured two connection settings: Read and Write. These are for read-write separation scenarios. Some services need to continuously query the database but almost never perform write operations, such as a background scheduled task that queries the number of users every minute and sends statistical information to third-party platforms like Slack. Other services may require both reading and writing; in this case, a write connection can be used, such as in a user registration scenario. During registration, if the user doesn't exist, they are created; otherwise, no operation is performed.  

This is a typical OLAP and OLTP scenario. It's very common in web applications. If your business doesn't have this requirement or your database architecture isn't designed for read/write separation, and you only have one database instance, like in the current example, then you can simply set the read and write configurations to be exactly the same.  

This is an example of calling a database read function; you can use the `GetDBR()` method.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/keepchen/go-sail/v3/sail"
)

...
// highlight-start
sail.GetDBR().Where(...).First(...)
// highlight-end
...
```

This is an example of calling a database write function; you can use the `GetDBW()` method.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/keepchen/go-sail/v3/sail"
)

...
// highlight-start
sail.GetDBW().Where(...).Updates(...)
// highlight-end
...
```
:::tip  
The syntactic sugar for database operations is exactly the same as that for GORM, because it's GORM itself. For more detailed examples of how to use it, please refer to the [official GORM documentation](https://gorm.io).
:::  

## Database Transactions  
Database transactions are crucial for ensuring data consistency. In Go-Sail, you can easily use the transaction processing mechanism provided by GORM, as shown in the code below.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/keepchen/go-sail/v3/sail"
)

...
// highlight-start
sail.GetDBW().Transaction(func(tx *gorm.DB) error {
    // assert if user exist
    err := tx.Where(&User{Username: "..."}).First(&user).Error
    if err != nil {
        return err
    }
    if len(user.Username) != 0 {
        return nil
    }
    // create user if not exist
    return tx.Create(&User{Username: "...", Password: "..."}).Error
})
// highlight-end
...
```  
:::danger  
It's important to note that to ensure data consistency, you must always use the `tx` keyword for transaction processing within the `Transaction()` function. Otherwise, you will encounter unpredictable problems.  

Furthermore, it is strongly recommended that you use the `GetDBW()` keyword provided by Go-Sail for transactional access, even if your read/write separation configuration is completely identical.
:::  

## Timeout control  
In actual business processing, various practical problems often arise that lead to excessively long processing times, i.e., waiting periods. In such cases, it is necessary to reasonably constrain the waiting time. The most direct method is timeout control; for example, database operations should not exceed 5 seconds, otherwise they should be canceled.  
```go title="main.go" showLineNumbers  
package main

import (
    "context"

    "github.com/keepchen/go-sail/v3/sail"
)

...
// highlight-start
ctx, cancel = context.WithTimeout(context.Background(), time.Second*5)
// highlight-end
sail.GetDBW().
    // highlight-start
    WithContext(ctx).
    // highlight-end
    Transaction(func(tx *gorm.DB) error {
        // assert if user exist
        err := tx.Where(&User{Username: "..."}).First(&user).Error
        if err != nil {
            return err
        }
        if len(user.Username) != 0 {
            return nil
        }
        // create user if not exist
        return tx.Create(&User{Username: "...", Password: "..."}).Error
    })
...
```  

## Baseline Time  
Base time is a crucial metric in database systems, especially in complex environments such as distributed systems or global multi-datacenter environments, where ensuring consistent time across all systems is paramount. When your services operate in different time zones and require consistent behavior in retrieving the "current time," you need to specify the `NowFunc` setting in the database configuration.  

Taking a global application as an example, in order to maintain consistency, the business side may need to display the same time display to users all over the world. Therefore, we need to agree on the same time function and the same time zone to ensure the correct representation of data in subsequent output and transformation.  

For example, we set the database timezone to `UTC`.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
            // highlight-start
            NowFunc: func() time.Time {
                return time.Now().In(time.UTC)
            },
            // highlight-end
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }

            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  

## Logging  
Logging is one of the important methods for troubleshooting, and it can also help record certain events or data. For example, recording slow queries, recording SQL execution errors, and so on.  

In the Go-Sail ecosystem, the logging component used for database logging is based on the `uber/zap` logging library and is shared with the global logging component. To use it better, we need to make corresponding configurations.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
            // highlight-start
            Logger: db.Logger{
                Level: "warn",
                SlowThreshold: 100,
                SkipCallerLookup: true,
                IgnoreRecordNotFoundError: true,
                Colorful: false,
            },
            // highlight-end
            NowFunc: func() time.Time {
                return time.Now().In(time.UTC)
            },
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }

            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
### Field Explanation  
- **Level**  
Refers to the level of logging, currently supporting the following levels (from low to high):  
    - silent
    - info  
    - warn
    - error

- **SlowThreshold**  
Slow log time threshold, in milliseconds. SQL statements that exceed this execution time will be recorded.  

- **SkipCallerLookup**  
Whether to skip printing the call chain.  

- **IgnoreRecordNotFoundError**  
By default, GORM returns a `RecordNotFoundError` type error when a query record does not exist. Setting this option to `true` can ignore this error.  

- **Colorful**  
Whether to print logs in color. In general, it is recommended to set it to `false`.  

## Migration  
Usually, we need to automatically migrate and synchronize the database table structure. Taking the above example, at the beginning, the user table does not exist in the database, so we need to synchronize and update the table structure when the service starts for subsequent use.  

:::tip
Some companies or teams may have professional DBAs, and the maintenance of database tables may be handled by them. It is also possible that, due to audit or other reasons, database maintenance needs to be distinguished in management, in which case programmatic automatic migration is not necessarily required.
:::

At this time, we can use the `AutoMigrate` function provided by GORM.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
            Logger: db.Logger{
                Level: "warn",
                SlowThreshold: 100,
                SkipCallerLookup: true,
                IgnoreRecordNotFoundError: true,
                Colorful: false,
            },
            NowFunc: func() time.Time {
                return time.Now().In(time.UTC)
            },
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }

            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
    afterFunc = func() {
        // highlight-start
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            sail.GetDBW().Create(&User{Username:"go-sail", password:"password"})
        }
        // highlight-end
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
