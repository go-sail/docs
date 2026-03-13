---
sidebar_position: 10
---  
# Configuration        
This chapter will introduce how to use Go-Sail for configuration parsing and hot updates.    

## Introduction  
Configuration has always been the soul of any software service; it dictates how a program operates and behaves. In the specific context of Go-Sail, the full range of configuration options is extensive. Relying entirely on hardcoding—as demonstrated in the previous examples—is neither standard practice nor practical, and it poses significant security risks. Typically, configuration settings (or configuration files) are kept separate from the program's source code; this approach enhances the application's adaptability and security.  

## Separation  
Robust software design should possess the capability to read configuration settings in order to provide services, rather than hard-coding those settings directly into the source code. Consequently, it becomes necessary to decouple the source code from the configuration files.  

Go-Sail offers three popular configuration file formats, namely:  
- YAML  
- TOML  
- JSON

There is no inherent superiority or inferiority among them; developers can utilize them as needed, in accordance with their own or their team's preferences and style.  

### Starting from Scratch  
Initially, you may not have a configuration file—or perhaps you have one, but it is empty. Manually declaring each item one by one is clearly not a sensible approach. Instead, we can leverage the scaffolding provided by Go-Sail to generate a configuration file template.  
```go title="configuration_test.go" showLineNumbers  
import (
    "testing"
    "github.com/keepchen/go-sail/v3/sail/config"
)

func TestGivemeConfigurationTemplate(t *testing.T) {
    config.PrintTemplateConfig("yaml", "./go-sail.config.local.yaml")
}
```  
You may have noticed that, this time, we created a new file named `configuration_test.go` instead of writing the code directly within `main.go`. The purpose of this is to enable you to run it directly within an IDE such as GoLand or Visual Studio Code.  

Upon execution, the scaffolding tool will generate a configuration file named `go-sail.config.local.yaml` within the current directory. This file contains the core configuration for Go-Sail; however, you do not need to fill in every single field—simply provide the values ​​you require, and you may even delete the remaining configuration entries.  

The generated content is roughly as follows: 
```yaml
http_conf:
  debug: false
  addr: ""
  swagger_conf:
    enable: false
    redoc_ui_path: ""
    json_path: ""
    favicon_path: ""
  prometheus_conf:
    enable: false
    addr: ""
    access_path: ""
    disable_system_sample: false
    disk_path: ""
    sample_interval: ""
  websocket_route_path: ""
  trusted_proxies: []
logger_conf:
  console_output: false
  env: ""
  level: ""
  modules: []
  filename: ""
  max_size: 0
  max_backups: 0
  compress: false
  exporter:
    provider: ""
    redis:
      list_key: ""
      conn_conf:
        endpoint:
          host: ""
          port: 0
          username: ""
          password: ""
        enable: false
        database: 0
        ssl_enable: false
      cluster_conn_conf:
        enable: false
        ssl_enable: false
        endpoints: []
    nats:
      subject: ""
      conn_conf:
        enable: false
        endpoints: []
        username: ""
        password: ""
    kafka:
      topic: ""
      conn_conf:
        enable: false
        endpoints: []
        SASLAuthType: ""
        username: ""
        password: ""
        timeout: 0
db_conf:
  enable: false
  driver_name: ""
  auto_migrate: false
  disable_foreign_key_constraint_when_migrating: false
  disable_nested_transaction: false
  allow_global_update: false
  skip_default_transaction: false
  logger:
    level: ""
    slow_threshold: 0
    skip_caller_lookup: false
    ignore_record_not_found_error: false
    colorful: false
  connection_pool:
    max_open_conn_count: 0
    max_idle_conn_count: 0
    conn_max_life_time_minutes: 0
    conn_max_idle_time_minutes: 0
  mysql:
    read:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      charset: ""
      parseTime: false
      loc: ""
    write:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      charset: ""
      parseTime: false
      loc: ""
  postgres:
    read:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      ssl_mode: ""
      timezone: ""
    write:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      ssl_mode: ""
      timezone: ""
  sqlserver:
    read:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
    write:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
  sqlite:
    read:
      file: ""
    write:
      file: ""
  clickhouse:
    read:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      read_timeout: 0
      write_timeout: 0
    write:
      host: ""
      port: 0
      username: ""
      password: ""
      database: ""
      read_timeout: 0
      write_timeout: 0
redis_conf:
  endpoint:
    host: ""
    port: 0
    username: ""
    password: ""
  enable: false
  database: 0
  ssl_enable: false
redis_cluster_conf:
  enable: false
  ssl_enable: false
  endpoints: []
nats_conf:
  enable: false
  endpoints: []
  username: ""
  password: ""
jwt_conf: null
email_conf:
  workers: 0
  worker_throttle_seconds: 0
  host: ""
  port: 0
  username: ""
  password: ""
  from: ""
  subject: ""
  params:
    variables: []
kafka_conf:
  conf:
    enable: false
    endpoints: []
    SASLAuthType: ""
    username: ""
    password: ""
    timeout: 0
  topic: ""
  groupID: ""
etcd_conf:
  enable: false
  endpoints: []
  username: ""
  password: ""
  timeout: 0
valkey_conf:
  enable: false
  username: ""
  password: ""
  endpoints: []
```

:::tip
Actual content may vary with version updates.
:::

## Reading and Hot Updates  
### Reading  
Once you have completed the necessary configuration settings, we need to modify the source code to read them.  

First, declare a configuration definition. Then, process it using Go-Sail's built-in configuration reading functions.    

```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "go.uber.org/zap"
    "gopkg.in/yaml.v2"

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

    // highlight-start
    conf config.Config
    // highlight-end


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

            headers := map[string]string{
                "X-Request-Id": sail.LogTrace(c).RequestID(),
            }
            sail.Utils().HttpClient().SendRequest("POST", "https://....", nil, headers)

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

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    // highlight-start
    parseFn := func(content []byte, viaWatch bool) {
        fmt.Println("config content: ", string(content))
        yaml.Unmarshal(content, &conf)
    }
    sail.Config(nil).ViaFile("./go-sail.config.local.yaml").Parse(parseFn)
    // highlight-end

    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

### Hot Updates  
Typically, we expect configuration changes to take effect immediately without requiring a service restart—as doing so would interrupt service availability and result in a poor user experience. In such scenarios, the configuration monitoring solution provided by Go-Sail offers the ideal solution.  
```go title="main.go" showLineNumbers  
package main

import (
    "fmt"
    "time"

    "go.uber.org/zap"
    "gopkg.in/yaml.v2"

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

    // highlight-start
    conf config.Config
    // highlight-end

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

            headers := map[string]string{
                "X-Request-Id": sail.LogTrace(c).RequestID(),
            }
            sail.Utils().HttpClient().SendRequest("POST", "https://....", nil, headers)

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

        sail.GetLogger("schedule").Info("logging something...")
    }
)

func main() {
    parseFn := func(content []byte, viaWatch bool) {
        // highlight-start
        if viaWatch {
            //config has been reload, to do something...
        }
        // highlight-end
        fmt.Println("config content: ", string(content))
        yaml.Unmarshal(content, &conf)
    }
    sail.
    // highlight-start
    Config(parseFn).
    // highlight-end
    ViaFile("./go-sail.config.local.yaml").Parse(parseFn)

    options := &api.Option{
        ForceHttpCode200: true,
        DetectAcceptLanguage: true,
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

## Provider  
Go-Sail currently supports three configuration providers, namely:  
- File  
- Nacos  
- Etcd  

### File  
```go  
parseFn := func(content []byte, viaWatch bool){
    fmt.Println("config content: ", string(content))
    if viaWatch {
        //reload config...
    }
}
filename := "go-sail.config.local.yaml"

sail.Config(parseFn).ViaFile(filename).Parse(parseFn)
```  
:::tip  
The monitoring of file mode is based on the modification time of the file.
:::

### Nacos  
```go
parseFn := func(content []byte, viaWatch bool){
    fmt.Println("config content: ", string(content))
    if viaWatch {
        //reload config...
    }
}

endpoints := "endpoint1,endpoint2"
namspaceID := ""
groupName := ""
dataID := "go-sail.config.local.yaml"

sail.Config(true, parseFn).ViaNacos(endpoints, namespaceID, groupName, dataID).Parse(parseFn)
```

### Etcd  
```go
parseFn := func(content []byte, viaWatch bool){
    fmt.Println("config content: ", string(content))
    if viaWatch {
        //reload config...
    }
}
etcdConf := etcd.Conf{
	Endpoints: []string{""},
	Username: "",
	Password: "",
}
key := "go-sail.config.local.yaml"

sail.Config(parseFn).ViaEtcd(etcdConf, key).Parse(parseFn)
```  

## As a Component  
With Nacos and Etcd, when using these methods to retrieve configurations, you can specify whether to activate them as components. Activating it is also very simple: simply specify a Boolean value as the second argument.  
 ```go
parseFn := func(content []byte, viaWatch bool){
    fmt.Println("config content: ", string(content))
    if viaWatch {
        //reload config...
    }
}
etcdConf := etcd.Conf{
	Endpoints: []string{""},
	Username: "",
	Password: "",
}
key := "go-sail.config.local.yaml"

sail.
// highlight-start
Config(parseFn, true).
// highlight-end
ViaEtcd(etcdConf, key).Parse(parseFn)
```  
Subsequently, the components can be accessed via the control plane.  
```go
sail.GetEtcdInstance()
```