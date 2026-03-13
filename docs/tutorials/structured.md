---
sidebar_position: 11
---  
# Structured        
This chapter will introduce how to structure a project.    

## Introduction  
At this point, we have used Go-Sail to build a simple login service, complete with capabilities for reading configurations, hot-reloading settings, and distributed tracing. However, you may have noticed a potential issue: almost all of our current code resides within the `main.go` file. This is neither an error nor a sign of unprofessionalism; rather, it was done to present the tutorial content in the most direct and straightforward manner possible. In real-world projects, however—and to ensure the readability, maintainability, and healthy, sustainable evolution of the codebase—we must properly structure the project.  

## File Splitting  
First, we split the massive `main.go` file into smaller units. Adhering to the industry-standard MVC paradigm, we divided the codebase into controllers (often referred to as "handler functions" within the Go ecosystem) and data models; for a purely API-based service, the "view" module is, of course, absent. Additionally, we introduced several new modules: "routing," "services," and "configuration."  

### Handlers  
```go title="handlers.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
    LoginSvc(c)
}

func ThirdPartyNotify(c *gin.Context) {
    ThirdPartyNotifySvc(c)
}
```  

### Middlewares  
```go title="middlewares.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
)

...

// ValidateToken validate user's token
func ValidateToken() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.Request.Header.Get("Authorization")
        if token != "this-is-a-valid-token" {
            sail.Response(c).Wrap(sailConstants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }

        c.Next()
    }
}

...
```  

### Models  
```go title="models.go" showLineNumbers  
package main

type User struct {
    Username string `gorm"column:username;type:varchar(100);NOT NULL;comment:username"`
    Password string `gorm"column:password;type:varchar(1024);NOT NULL;comment:password"`
}

func (User) TableName() string {
	return "users"
}
```  

### Routes  
```go title="routes.go" showLineNumbers
package main

import (
    "github.com/gin-gonic/gin"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

func RegisterRoutes(ginEngine *gin.Engine) {
    ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

    ginEngine.POST("/login", Login)
    userGroup := ginEngine.Group("/user").Use(ValidateToken())
    {
        userGroup.GET("/balance", ...).
            GET("/info", ...).
            GET("/logout", ...)
    }
    ginEngine.POST("/third-party/notify", ThirdPartyNotify)
}
```

### Services  
```go title="services.go" showLineNumbers  
package main

import (
    "fmt"
    "net/http"

    "go.uber.org/zap"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

func LoginSvc(c *gin.Context) {
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

    headers := map[string]string{
        "X-Request-Id": sail.LogTrace(c).RequestID(),
    }
    sail.Utils().HttpClient().SendRequest("POST", "https://....", nil, headers)

    token := "this-is-a-valid-token"
    sail.Response(c).Data(token)
}

func ThirdPartyNotifySvc(c *gin.Context) {
    c.JSON(http.StatusOK, "SUCCESS")
}
```  

### Errors  
```go title="errors.go" showLineNumbers  
package main

import (
    "fmt"
    "sync"

    sailConstants "github.com/keepchen/go-sail/v3/constants"
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
```  

### Types  
```go title="types.go" showLineNumbers  
package main

import (
    "fmt"

    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

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
```  

### Config  
```go title="config.go" showLineNumbers  
package main

import (
    "gopkg.in/yaml.v2"

    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"


var conf config.Config

func ParseConfig() {
    parseFn := func(content []byte, viaWatch bool) {
        if viaWatch {
            //config has been reload, to do something...
        }
        fmt.Println("config content: ", string(content))
        yaml.Unmarshal(content, &conf)
    }
    sail.Config(parseFn).ViaFile("./go-sail.config.local.yaml").Parse(parseFn)
}
```  

### Main  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/http/api"
)

var (
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
    ParseConfig()

    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", &conf).
        SetupApiOption(options).
        Hook(RegisterRoutes, nil, afterFunc).Launch()
}
```  
Based on the breakdown above, we have split the original `main.go` file into separate files. However, up to this point, all the code still belongs to the `main` package, and all the files reside within the same directory.In real-world scenarios, this is insufficient; the granularity is typically much finer.  

## Directory Structure  
In actual engineering projects, directories are often organized by module, and the Go packages to which the code belongs also vary accordingly.Building upon the structured foundation above, let us take it a step further.   


### Handlers  
```go title="http/handlers/user.go" showLineNumbers  
package handlers

import (
    "[module name]/http/services"

    "github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
    services.LoginSvc(c)
}
```  

```go title="http/handlers/third-party.go" showLineNumbers  
package handlers

import (
    "[module name]/http/services"

    "github.com/gin-gonic/gin"
)

func ThirdPartyNotify(c *gin.Context) {
    services.ThirdPartyNotifySvc(c)
}
```  

### Middlewares  
```go title="http/middlewares/authorization.go" showLineNumbers  
package middlewares

import (
    "github.com/gin-gonic/gin"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
)

// ValidateToken validate user's token
func ValidateToken() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.Request.Header.Get("Authorization")
        if token != "this-is-a-valid-token" {
            sail.Response(c).Wrap(sailConstants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }

        c.Next()
    }
}
```  

### Models  
```go title="pkg/models/user.go" showLineNumbers  
package models

type User struct {
    Username string `gorm"column:username;type:varchar(100);NOT NULL;comment:username"`
    Password string `gorm"column:password;type:varchar(1024);NOT NULL;comment:password"`
}

func (User) TableName() string {
	return "users"
}
```  

### Routes  
```go title="http/routes/routes.go" showLineNumbers
package routes

import (
    "[module name]/http/middlewares"

    "github.com/gin-gonic/gin"
    sailMiddleware "github.com/keepchen/go-sail/v3/http/middleware"
)

func RegisterRoutes(ginEngine *gin.Engine) {
    ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())

    ginEngine.POST("/login", Login)
    userGroup := ginEngine.Group("/user").Use(middlewares.ValidateToken())
    {
        userGroup.GET("/balance", ...).
            GET("/info", ...).
            GET("/logout", ...)
    }
    ginEngine.POST("/third-party/notify", ThirdPartyNotify)
}
```

### Services  
```go title="http/services/user.go" showLineNumbers  
package services

import (
    "net/http"

    "[module name]/http/types"
    "[module name]/pkg/common"
    "[module name]/pkg/models"

    "go.uber.org/zap"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

func LoginSvc(c *gin.Context) {
    var loginRequest types.LoginRequest
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
    sail.GetDBR().Where(&models.User{Username: loginRequest.Username}).First(&user)
    // user not exist
    if len(loginRequest.Username) == 0 {
        sail.Response(c).Wrap(common.ErrUserNotExist, nil).Send()
        return
    }
    // password not match
    if loginRequest.Password != user.Password {
        sail.Response(c).Wrap(sailConstants.ErrRequestParamsInvalid, nil).Send()
        return
    }

    headers := map[string]string{
        "X-Request-Id": sail.LogTrace(c).RequestID(),
    }
    sail.Utils().HttpClient().SendRequest("POST", "https://....", nil, headers)

    token := "this-is-a-valid-token"
    sail.Response(c).Data(token)
}
```  

```go title="http/services/third-party.go" showLineNumbers  
package services

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

func ThirdPartyNotifySvc(c *gin.Context) {
    c.JSON(http.StatusOK, "SUCCESS")
}
```  

### Errors  
```go title="pkg/common/errors.go" showLineNumbers  
package common

import (
    "fmt"
    "sync"

    sailConstants "github.com/keepchen/go-sail/v3/constants"
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
```  

### Types  
```go title="http/types/user.go" showLineNumbers  
package types

import (
    "fmt"

    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

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
```  

### Config  
```go title="config/config.go" showLineNumbers  
package config

import (
    "gopkg.in/yaml.v2"

    "github.com/keepchen/go-sail/v3/sail"
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"


var conf sailConfig.Config

func ParseConfig() {
    parseFn := func(content []byte, viaWatch bool) {
        if viaWatch {
            //config has been reload, to do something...
        }
        fmt.Println("config content: ", string(content))
        yaml.Unmarshal(content, &conf)
    }
    sail.Config(parseFn).ViaFile("./go-sail.config.local.yaml").Parse(parseFn)
}

func Get() *sailConfig.Config {
    return &conf
}
```  

### Main  
```go title="main.go" showLineNumbers  
package main

import (
    "[module name]/config"
    "[module name]/http/routes"
    "[module name]/pkg/models"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/http/api"
)

var (
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&models.User{})
        var user User
        sail.GetDBW().Where(&models.User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    config.ParseConfig()

    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", config.Get()).
        SetupApiOption(options).
        Hook(routes.RegisterRoutes, nil, afterFunc).Launch()
}
```  


Following this series of structural optimizations, we can see that each file now serves a distinct purpose, and everything has become well-organized. Consequently, extending functionality based on this foundation will be remarkably easy.    

:::tip  
Go-Sail does not impose rigid constraints on your project structure; how the structure is organized is entirely up to the user. After all, there is no single "best" approach—only the one that is most suitable.
:::