---
sidebar_position: 7
---  
# Validation        
This chapter will introduce how to perform data validation.    

## Introduction  
As a modern web application, frequent interaction with the client is a common occurrence—and such interaction is inseparable from data requests and data validation. While Go-Sail does not mandate or provide specific out-of-the-box components for this purpose, we recommend a specific validation paradigm: validate the data, and then return an error code along with an error message. This approach is illustrated in the code snippet below.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/http/api"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

// highlight-start
func (v LoginRequest) Validator() (sailConstants.ICodeType, error) {
    if len(v.Username) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("username can not be empty")
    }

    if len(v.Password) == 0 {
        return sailConstants.ErrRequestParamsInvalid, fmt.Errorf("password can not be empty")
    }

    return sailConstants.ErrorNone, nil
}
// highlight-end

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
            // highlight-start
            if code, err := loginRequest.Validator(); err != nil {
                sail.Response(c).Wrap(code, nil, err.Error()).Send()
                return
            }
            // highlight-end

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
As evident from the highlighted code above, adhering to this paradigm offers a significant advantage: response results can be seamlessly integrated with the responder. Within the `Validator()` function, you have the flexibility to incorporate suitable components—tailoring them to your or your team's specific context—or, as demonstrated in the example code, implement the logic using purely native code; this approach is particularly well-suited for scenarios requiring a high degree of customization.  
