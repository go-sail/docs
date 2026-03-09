---
sidebar_position: 6
---  
# Responses      
This section will explain how to use a responder to return a response to the requesting client.  

## Introduction  
In a formal application or system, a stable and reliable response structure is the bridge between the server and the client, and the cornerstone of data exchange. Go-Sail's built-in responder aims to achieve this, providing the server with stable response output and seeking order amidst complexity.  

## Convention  
In the Go-Sail ecosystem, the standardized response structure is JSON data format. This is also the preferred format for the vast majority of modern applications. However, please note that this is not mandatory, and developers can still adopt it as needed.  

## Creating Responses  
As you may have noticed from the previous examples, Go-Sail makes it easy to create a response, like this:  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/constants"
)

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
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                // highlight-start
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
                // highlight-end
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                // highlight-start
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
                // highlight-end
                return
            }

            token := "this-is-a-valid-token"
            // highlight-start
            sail.Response(c).Data(token)
            // highlight-end
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
            userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

## HTTP Status Code  
HTTP status codes are a well-established standard, but the implementation guidelines followed by different teams or companies vary. Some believe that the classification of HTTP status codes should be strictly enforced, while others believe that, except for a few special status codes (such as 200, 401, 403, 404, 500, 502, 504, etc.), they should be unified.  

In reality, each has its advantages. Go-Sail has no intention of getting involved in the debate or forcing anyone to choose. Instead, it leaves the choice to the developers and the teams themselves.  

Go-Sail was designed from the outset to intentionally emphasize error codes and use them in conjunction with HTTP status codes. This is because we believe error codes possess expressive qualities. For example, with the HTTP status code 400, error code 100000 could indicate an incorrect data type for a passed field, while 100001 could indicate a value for a field is no longer trusted. Combined with internationalized error messages, we believe this will make the application's interaction more user-friendly.  

### Explicit error codes  
Error codes are a crucial part of the Go-Sail responder. Furthermore, Go-Sail advocates for explicit error codes, which is a good starting point for maintaining code maintainability.  

In the Go-Sail ecosystem, there are some error codes that are pre-associated with HTTP status codes. These are:  
- **ErrNone (0)**  
This means that no error occurred, corresponding to HTTP status code **200**.    

- **ErrRequestParamsInvalid (100000)**  
The request parameters are incorrect, corresponding to HTTP status code **400**.  

- **ErrAuthorizationTokenInvalid (100001)**  
The authorization token has expired, corresponding to HTTP status code **401**.  

- **ErrInternalServerError (999999)**  
An internal server error has occurred, corresponding to HTTP status code **500**.  

Although Go-Sail pre-sets these error code values, developers can still override them based on existing conditions. You can configure these settings when the program starts, like this:  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/http/api"
    "github.com/keepchen/go-sail/v3/constants"
)

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
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
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
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    // highlight-start
    options := &api.Option{
        ErrNoneCode: 200,
        ErrRequestParamsInvalidCode: 2000,
        ErrAuthorizationTokenInvalidCode: 3000,
        ErrInternalServerErrorCode: 4000,
    }
    // highlight-end
    sail.WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(options).
        // highlight-end
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
In this way, the responder will use this information to infer the appropriate HTTP status code to respond to the requesting client. For example, when error code 2000 is hit, the HTTP status code is 400, and when error code 3000 is hit, the HTTP status code is 401.  

At the same time, Go-Sail's responders allow you to override the original character descriptions of error codes, making it more inclusive. 
```go title="main.go" showLineNumbers
func main() {
    options := &api.Option{
        ErrNoneCode: 200,
        // highlight-start
        ErrNoneCodeMsg: "Cool!",
        // highlight-end
        ErrRequestParamsInvalidCode: 2000,
        // highlight-start
        ErrRequestParamsInvalidCodeMsg: "Check your input again.",
        // highlight-end
        ErrAuthorizationTokenInvalidCode: 3000,
        // highlight-start
        ErrAuthorizationTokenInvalidCodeMsg: "Guest?",
        // highlight-end
        ErrInternalServerErrorCode: 4000,
        // highlight-start
        ErrInternalServerErrorCodeMsg: "Oops~ Looks like something went wrong.",
        // highlight-end
    }
    sail.WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(options).
        // highlight-end
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```   


### Forced status codes  
If you and your team have agreed that all responses will use the same HTTP success status code(200), while the specific details will be handled by error codes, then you can specify it like this:  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/http/api"
    "github.com/keepchen/go-sail/v3/constants"
)

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
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
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
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    // highlight-start
    options := &api.Option{
        ForceHttpCode200: true,
    }
    // highlight-end
    sail.WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(options).
        // highlight-end
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
After this, the responder no longer infers the HTTP status code based on the error code, but instead forces the use of 200 as the successful HTTP status code to respond to the requester.  

At the same time, you can still temporarily respond with different HTTP status codes based on some special circumstances.  
```go main.go showLineNumbers
sail.Response(c).Wrap(...).SendWithCode(403)
```  
This method has the highest priority and will not be constrained by error codes or the `ForceHttpCode200` configuration.  

### Registration error code  
Developers can register the actual error codes into the Go-Sail error code container according to their own business needs. Then, they can use them in subsequent response processes.  

:::tip  
We strongly recommend that you use constants for registration, as this will make the code more readable.
:::  

```go title="main.go" showLineNumbers  
type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = map[ErrorCode]string{
    ErrUserNotExist:                "User not exist",
    ErrUserAlreadyExist:            "User already exist",
    ErrUsernameAndPasswordNotMatch: "Username and password not match",
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for code, msg := range codeMsgMap {
                sail.Code().Register("en", code.Int(), msg)
            }
        })
    })
}
```  
### Use error code    
After this, you can use it like this:  

```go title="main.go" showLineNumbers  
sail.Response(c).Bundle(ErrUserNotExist.Int(), nil).Send()
```  

## Wrappers  
Go-Sail offers three different wrappers.  
- Builder  
- Wrap  
- Bundle  

These three different wrappers are suitable for different scenarios, and we will introduce them one by one.  

We assume the following data structure definition:  
```go title="main.go" showLineNumbers  
import "github.com/keepchen/go-sail/v3/http/pojo/dto"

type UserInfo struct {
    dto.Base
    Data struct {
        Nickname string `json:"nickname" validate:"required" format:"string"`
        Age      number `json:"nickname" validate:"required" format:"number"`
    } `json:"data" validate:"required" format:"object"`
}

func (v UserInfo) GetData() interface{} {
    return v.Data
}

type SimpleUser struct {
    Nickname string `json:"nickname" validate:"required" format:"string"`
    Age      number `json:"nickname" validate:"required" format:"number"`
}
```  

### Builder  
The error code parameter type of the Builder wrapper needs to be Go-Sail's `constants.ICodeType`, and the response data type needs to be `dto.IResponse`.  
```go title="main.go" showLineNumbers  
var userInfo UserInfo
sail.Response(c).Builder(constants.XX, userInfo).Send()
```  

### Wrap  
The error code parameter type of the Wrap wrapper needs to be Go-Sail's `constants.ICodeType`, and the response data type needs to be `interface`, in higher versions of Golang, it is also called the `any` data type.   
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(constants.XX, userInfo).Send()
```  

### Bundle  
The error code parameter type of the Bundle wrapper needs to be `int`, and the response data type needs to be `interface`, in higher versions of Golang, it is also called the `any` data type. In terms of ease of use, Bundle is the easiest.  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Bundle(200, userInfo).Send()
```  

Essentially, there is no substantial difference between the three. The key lies in the appropriate encapsulation of syntactic sugar, and you can observe that their constraints gradually loosen.

As for the `dto.Base` combination, this is to accommodate the needs of developer documentation. Some teams require that the response value of every interface document should include a 'fixed structure', while other teams may, due to convention, only need to show the refined data part without repeating the fixed structure.

## Fixed structure  
The fixed structure is a response structure designed by the Go-Sail responder to achieve stable output. You can think of it as fixed fields. Its design is located in `http/pojo/dto/base.go`.  
```go  title="base.go" showLineNumbers  
type Base struct {
    // in: body
    // required: true
    RequestID string `json:"requestId" example:"5686efa5-c747-4f63-8657-e6052f8181a9" format:"string" validate:"required"`
    // in: body
    // required: true
    Code int `json:"code" format:"int" example:"0" validate:"required"`
    // in: body
    // required: true
    Success bool `json:"success" example:"true" format:"bool" validate:"required"`
    // in: body
    // required: true
    Message string `json:"message" example:"SUCCESS" format:"string" validate:"required"`
    // in: body
    // required: true
    Timestamp int64 `json:"ts" example:"1670899688591" format:"int64" validate:"required"`
    // in: body
    // required: true
    Data any `json:"data" format:"object|array|string|number|boolean" validate:"required"`
}
```  
It specifies that the responder will always respond to the requesting client with a fixed field structure. It specifies that the responder will always respond to the requesting client with a fixed field structure. The actual business logic content will be populated in the `data` field, while the other fields will remain unchanged and will always be maintained by the responder.  

The final output format and content will look roughly like this:  
```json showLineNumbers  
{
  "code": 0,
  "data": null,
  "message": "SUCCESS",
  "requestId": "5686efa5-c747-4f63-8657-e6052f8181a9",
  "success": true,
  "ts": 1670899688591
}
```  
:::tip 
For more usage examples, please refer to the [Responder](../examples/responder) section.
:::

## Unconventional  
Sometimes, we need to respond to requests with non-fixed data structures, especially when interacting with third-party systems, such as payment systems. In this case, you can directly use the response methods included in `gin.Context`, without needing to use Go-Sail's responders.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/http/api"
    "github.com/keepchen/go-sail/v3/constants"
)

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
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)

            var user User
            sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
            // user not exist
            if len(loginRequest.Username) == 0 {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
                return
            }
            // password not match
            if loginRequest.Password != user.Password {
                sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
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
        // highlight-start
        ginEngine.POST("/third-party/notify", func(c *gin.Context){
            c.JSON(200, ...)
        })
        // highlight-end
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User)
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
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  


