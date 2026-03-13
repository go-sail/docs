---
sidebar_position: 9
---  
# Logging        
This section will introduce how to perform logging in Go-Sail.  

## Introduction  
Logging is a task performed by virtually every system. The reason is simple: logs enable you to trace events, thereby facilitating problem localization and troubleshooting.

To help you gain better insight into what is happening internally within your applications, Go-Sail provides a robust logging service that allows you to record messages to files or export them via exporters.  

## Configuration  
Go-Sail's logging component is based on the `uber/zap` logging library and is automatically activated upon startup. We can specify its operational behavior through configuration.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        // highlight-start
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
        },
        // highlight-end
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
The highlighted sample code specifies a logging level of `warn`, directs the output to a file named `running.log` located in the current directory, and limits the file size to 100MB. Go-Sail's logging component supports log rotation; therefore, you need not worry about log files becoming excessively large or numerous and filling up your disk. The `MaxBackups` setting designates that only the 10 most recent files are retained, and the rotated files are compressed—a feature that further conserves disk space.  

### Level  
The log level determines which specific levels of logs are recorded; however, this is independent of how you invoke the logging function, as it takes effect during the configuration stage.  
Log levels are categorized into the following levels, ranging from lowest to highest:  
- debug  
- info  
- warn  
- error  

When making calls, prioritize their usage based on urgency and importance. For example, when you simply want to print out some information—rather than indicating that an error has occurred—you can use the `Info()` method.  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger().Info("logging something...")
}
```  
When the configured logging level is set higher than `info`, the logs generated by this code will not be recorded in the log file. This facilitates global control.  

### ConsoleOutput  
By default, logs are merely recorded and output to a log file. However, there are times when you may wish to print the logs to the terminal simultaneously—in addition to outputting them to the file—to facilitate observation by developers. To do this, simply specify the appropriate configuration, as shown below.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
            // highlight-start
            ConsoleOutput: true,
            // highlight-end
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
### Modules  
The purpose of the module list is to categorize and record logs into specific files, tailored to the requirements of the caller. This approach is suitable for scenarios where log classification is necessary. For instance, I might choose to record logs generated by scheduled tasks into a dedicated `schedule` file; since scheduled tasks execute periodically, their logs—though potentially sparse—are often critical in nature, and separating them ensures ease of review.  

At this point, a declaration in the configuration section is sufficient. Subsequently, you can proceed to invoke the specific module.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
            ConsoleOutput: true,
            // highlight-start
            Modules: []string{"schedule"},
            // highlight-end
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }

        // highlight-start
        sail.GetLogger("schedule").Info("logging something...")
        // highlight-end
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
:::tip  
If you call a non-existent module, the logs will be recorded in the default file.  

The logs generated by the following two lines of code will be recorded to the same location.  

```go 
sail.GetLogger().Info("...")
sail.GetLogger("no-existent-module").Info("...")
```
:::  

## Exporter  
Typically, Go-Sail outputs logs to local files. While this poses no issues in a development environment, in complex server environments—particularly within a microservices architecture—"local" storage is often unreliable and non-persistent. Consequently, it becomes necessary to route logs elsewhere—for instance, to a centralized log storage repository or to a dedicated ELK logging service. This is precisely where our exporters come into play.  

The Go-Sail exporter essentially synchronizes logs to message queue-like middleware, where they are subsequently consumed and processed by other consumers. Currently, the exporter supports the following middleware:  
- Redis (standalone)  
- Redis (Cluster)  
- Nats  
- Kafka  

:::tip  
Note that, to ensure no data loss, the Redis exporter does not utilize the Publish-Subscribe mechanism; instead, it employs the List data type to perform `RPush` operations. Consequently, consumers should retrieve data using the `LPop` method.  
:::  

When declaring an exporter, the connection details for the middleware—such as Redis, NATS, or Kafka connections—must be declared separately.  

When declaring an exporter, the connection details for the middleware—such as Redis, NATS, or Kafka—must be specified separately. To ensure the stability of the core service components, we intentionally decoupled the configuration for the core services from that of the log exporter components during the initial design phase. If you do not have such strict requirements, you may simply configure both sets of settings to be identical.  

## Distributed Tracing  
### Usage  

In web applications, logging and tracing the entire chain—encompassing the request, its subsequent processing, and the final response—is a very common practice.  

We may wish to monitor key events or error logs occurring throughout this entire process to facilitate troubleshooting and optimization; this is where distributed tracing comes into play.  
Link tracing is automatically activated upon service startup, and you are free to use it within your route handler functions.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "go.uber.org/zap"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
            ConsoleOutput: true,
            Modules: []string{"schedule"},
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            if err := c.ShouldBind(&loginRequest); err != nil {
                // highlight-start
                sail.LogTrace(c).Warn("bind request parameter failed", zap.Error(err))
                // highlight-end
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

### Component Passing  
To enable link tracing, we recommend retrieving the logging component from the context for logging purposes. Furthermore, you can pass this component as an argument deeper down the call stack.  

```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "go.uber.org/zap"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
            ConsoleOutput: true,
            Modules: []string{"schedule"},
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var (
                loginRequest LoginRequest
                // highlight-start
                loggerSvc = sail.LogTrace(c).GetLogger()
                // highlight-end
            )
            if err := c.ShouldBind(&loginRequest); err != nil {
                // highlight-start
                loggerSvc.Warn("bind request parameter failed", zap.Error(err))
                // highlight-end
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }

            // highlight-start
            toDoSomething(loggerSvc)
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  


### Concatenated Services  
In a microservices environment, it is very common for multiple services to make requests to one another. To fully stitch together the entire request trace, a request identifier must be passed along. If all of your services are built using Go-Sail, this process will be handled automatically.  

Let's take a look at how to chain identifiers. It is actually quite simple: whenever you initiate an HTTP request to another service, simply add an extra field—either `requestId` or `X-Request-Id`—to the request headers. The value for this field should be retrieved from the current request context.  

Just like this:  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "go.uber.org/zap"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = sailConstants.MMBox{
    //en
    sailConstants.LanguageEnglish: {
        ErrUserNotExist:                "User not exist",
        ErrUserAlreadyExist:            "User already exist",
        ErrUsernameAndPasswordNotMatch: "Username and password not match",
    },
    //zh-CN
    sailConstants.LanguageChinesePRC: {
        ErrUserNotExist:                "用户不存在",
        ErrUserAlreadyExist:            "用户已经存在",
        ErrUsernameAndPasswordNotMatch: "用户名或密码不正确",
    },
    //ja
    sailConstants.LanguageJapanese: {
        ErrUserNotExist:                "ユーザーが存在しません",
        ErrUserAlreadyExist:            "ユーザーは既に存在します",
        ErrUsernameAndPasswordNotMatch: "ユーザー名またはパスワードが正しくありません",
    },
    //other langugage
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
        })
    })
}

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
    publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
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
        LoggerConf: logger.Conf{
            Level: "warn",
            Filename: "running.log",
            MaxSize: 100,
            MaxBackups: 10,
            Compress: true,
            ConsoleOutput: true,
            Modules: []string{"schedule"},
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            if err := c.ShouldBind(&loginRequest); err != nil {
                sail.LogTrace(c).Warn("bind request parameter failed", zap.Error(err))
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
                return
            }

            // highlight-start
            headers := map[string]string{
                "X-Request-Id": sail.LogTrace(c).RequestID(),
            }
            sail.Utils().HttpClient().SendRequest("POST", "https://....", nil, headers)
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
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User{})
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

:::tip  
Currently, Go-Sail only handles HTTP requests. If your service utilizes other protocols—such as gRPC—you will need to integrate them manually. The underlying principles remain the same.
:::