---
sidebar_position: 8
---  
# Internationalization        
This chapter will introduce how to internationalize response messages.    

## Introduction  
When responding with data, if the system can intelligently deliver error or notification messages tailored to the client's language, the overall user experience becomes much more user-friendly.  

## Preparation  
As previously mentioned, the declared error codes can be defined separately for different languages; this establishes the fundamental groundwork for internationalization. Let us begin by reviewing how to register error codes.   
```go title="main.go" showLineNumbers  
import (
    "time"
    
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
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
                // highlight-start
                sail.Code().Register("en", code.Int(), msg)
                // highlight-end
            }
        })
    })
}
```  
As can be seen, the highlighted code declares the error codes and error messages for the registration response in English (i.e., language set to 'en').  

Now, let's apply this concept more broadly: what should we do if we want to register Japanese and Simplified Chinese? It is actually quite simple—just take a look at the code example below.  
```go title="main.go" showLineNumbers  
import (
    "time"

    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
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

// highlight-start
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
// highlight-end


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            // highlight-start
            for language, msgMap := range codeMsgMap {
                for code, msg := range msgMap {
                    sail.Code().Register(language.String(), code.Int(), msg)
                }
            }
            // highlight-end
        })
    })
}
```  
With the code above, we have completed the multilingual declarations; thus, the preparatory work is now finished.  

## Automatic Discovery  
Next, we want to enable Go-Sail's responder to intelligently detect the client's language and respond with corresponding messages. To achieve this, we need to utilize a routing middleware, and subsequently enable the responder's automatic language detection—as shown below.    
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
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        // highlight-start
        ginEngine.Use(sailMiddleware.DetectUserAgentLanguage())
        // highlight-end

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
        // highlight-start
        DetectAcceptLanguage: true,
        // highlight-end
    }
    sail.WakeupHttp("go-sail", conf).
        SetupApiOption(options).
        Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
## Rules and Doubts  
### Language Code  
The example code above utilizes Go-Sail's built-in language code constants—such as `sailConstants.LanguageEnglish`—but this is not strictly required; you may instead use hardcoded strings, such as `en`. As long as the code matches the client's language, the internationalization features will function correctly.  

:::warning  
Please note that the language characters must match the client's language characters exactly in order to function correctly.  
:::

### Rollback Rules  
You might be wondering: with so many languages ​​in the world, do I really have to declare every single one? Obviously not. If your product targets English, Japanese, and Portuguese-speaking regions, you simply need to define those three languages. Any other languages ​​not explicitly specified will automatically fall back to English.  

:::tip  
Would you like the fallback language to be configurable? We welcome your [feedback](https://github.com/keepchen/go-sail/issues).
:::  

As you can gather from the preceding description, English is an absolute necessity—you can think of it as a fallback solution.  