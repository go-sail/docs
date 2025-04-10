---
sidebar_position: 12
---  
# HTTP  
This chapter introduces the complete process of HTTP request and response.  
## Introduction  
In the HTTP request-response process, from the request reaching the service node, to process handling, and finally responding to the requester, each step will be processed as needed.  

## Request  
### Route Middleware  
Route middleware often plays the role of filtering, intercepting, and context management in the entire request call chain. It is commonly used for authentication and other purposes, and is typically positioned at the first location after the request arrives, before the handler function.  

Now, let's implement a simple authentication middleware.  
```go  title="examples/pkg/app/user/http/middleware/authcheck.go" showLineNumbers  
import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/constants"
)
func AuthCheck() gin.HandlerFunc {
    return func(c *gin.Context) {
        authorization := c.GetHeader("Authorization")
        if len(authorization) == 0 {
            sail.Response(c).Builder(constants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }

        uid := parseUserIDFromAuthorization(authorization)
        c.Set("userID", uid)
        c.Next()
    }
}

func parseUserIDFromAuthorization(authorization string) int64 {
    // TODO
    return int64(123)
}
```  
Register it to the routes.  
```go  title="examples/pkg/app/user/http/routes/routes.go" showLineNumbers  
import (
    "github.com/gin-gonic/gin"
    "examples/pkg/app/user/http/middleware"
    "examples/pkg/app/user/http/handler"
)

func RegisterRoutes(r *gin.Engine) {
    userGroup := r.Group("/user", middleware.AuthCheck())
    {
        userGroup.GET("info", handler.UserInfo)
    }
}
```  
### Entity  
The request entity defines the data structure of request parameters, which provides clear data types for subsequent parameter processing. Therefore, we recommend defining it explicitly. We also define its extended validation method to verify whether the internal data meets the requirements.  
```go title="examples/pkg/app/user/http/vo/request/userinforeqvo.go" showLineNumbers  
import (
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)
type UserInfoReqVO struct {
    ShowDetail     bool `json:"showDetail" form:"showDetail" validate:"required" format:"bool" `
    WithWalletInfo bool `json:"withWalletInfo" form:"withWalletInfo" validate:"required" format:"bool" `
}

func (v *UserInfoReqVO) Validator() (sailConstants.ICodeType, error) {
    return sailConstants.ErrNone, nil
}
```  
## Business Logic  
### Parameter Binding  
```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "go.uber.org/zap"
    "github.com/gin-gonic/gin"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
    "examples/pkg/app/user/http/vo/request"
)

func UserInfo(c *gin.Context) {
    var (
        ...
        form      request.UserInfoReqVO
        loggerSvc = sail.LogTrace(c).GetLogger()
        userID = c.MustGet("userID").(int64)
        ...
    )
    // highlight-start
    if err := c.ShouldBind(&form); err != nil {
    // highlight-end
        sail.Response(c).Failure400(sailConstants.ErrRequestParamsInvalid)
        return
    }
    if code, err := form.Validator(); err != nil {
        loggerSvc.Warn("[UserInfo] form field validate failed", zap.Errors("errors", []error{err}))
        sail.Response(c).Failure400(code)
        return
    }
    ...
}
```
### Parameter Validation  
```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "go.uber.org/zap"
    "github.com/gin-gonic/gin"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
    "examples/pkg/app/user/http/vo/request"
)

func UserInfo(c *gin.Context) {
    var (
        ...
        form      request.UserInfoReqVO
        loggerSvc = sail.LogTrace(c).GetLogger()
        userID = c.MustGet("userID").(int64)
        ...
    )
    if err := c.ShouldBind(&form); err != nil {
        sail.Response(c).Failure400(sailConstants.ErrRequestParamsInvalid)
        return
    }
    // highlight-start
    if code, err := form.Validator(); err != nil {
    // highlight-end
        loggerSvc.Warn("[UserInfo] form field validate failed", zap.Errors("errors", []error{err}))
        sail.Response(c).Failure400(code)
        return
    }
    ...
}
```  
### Handler Function  
```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "go.uber.org/zap"
    "github.com/gin-gonic/gin"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
    "examples/pkg/app/user/http/vo/request"
)

func UserInfo(c *gin.Context) {
    var (
        ...
        form      request.UserInfoReqVO
        loggerSvc = sail.LogTrace(c).GetLogger()
        userID = c.MustGet("userID").(int64)
        ...
    )
    if err := c.ShouldBind(&form); err != nil {
        sail.Response(c).Failure400(sailConstants.ErrRequestParamsInvalid)
        return
    }
    if code, err := form.Validator(); err != nil {
        loggerSvc.Warn("[UserInfo] form field validate failed", zap.Errors("errors", []error{err}))
        sail.Response(c).Failure400(code)
        return
    }

    // highlight-start
    var user User
    sail.GetDBR().Model(&User{}).Where("id = ?", userID).First(&user)
    // highlight-end
    ...
}
```  
## Response  
### Entity  
The response entity defines the data structure of the returned data, which will provide clear data types for subsequent response processing. Therefore, we recommend defining it explicitly.  
```go title="examples/pkg/app/user/http/vo/response/userinfoackvo.go" showLineNumbers  
import (
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

type UserInfoAckVO struct {
    UserID   int64  `json:"userId" format:"number" validate:"required" example:"123"`
    Email    string `json:"email" format:"string" validate:"required" example:"go-sail@example.com"`
    Nickname string `json:"nickname" format:"string" validate:"required" example:"go-sail"`
}
```  
### Response  
```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "go.uber.org/zap"
    
    sailConstants "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
    "examples/pkg/app/user/http/vo/request"
    "examples/pkg/app/user/http/vo/response"
)

func UserInfo(c *gin.Context) {
    var (
        ...
        form      request.UserInfoReqVO
        // highlight-start
        resp      resp.UserInfoAckVO
        // highlight-end
        loggerSvc = sail.LogTrace(c).GetLogger()
        userID = c.MustGet("userID").(int64)
        ...
    )
    if err := c.ShouldBind(&form); err != nil {
        sail.Response(c).Failure400(sailConstants.ErrRequestParamsInvalid)
        return
    }
    if code, err := form.Validator(); err != nil {
        loggerSvc.Warn("[UserInfo] form field validate failed", zap.Errors("errors", []error{err}))
        sail.Response(c).Failure400(code)
        return
    }

    var user User
    sail.GetDBR().Model(&User{}).Where("id = ?", userID).First(&user)
    ...
    // highlight-start
    resp.UserID = user.ID
    resp.Email = user.Email
    resp.Nickname = user.Nickname

    sail.Response(c).Data(resp)
    // highlight-end
}
```  
## Syntactic Sugar  
Syntactic sugar provides richer response functions.  
```go showLineNumbers  
sail.Response(c).Data(nil)

sail.Response(c).Success()

sail.Response(c).Failure()

sail.Response(c).Failure("failed")

sail.Response(c).Failure400()

sail.Response(c).Failure500()

sail.Response(c).Wrap(constants.XXX, anyValue, "SUCCESS").Send()
```  

## API Options  
API options allow developers to customize the behavior of the response handler.  
These options are set when the framework starts:  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/constants"
    // highlight-start
    "github.com/keepchen/go-sail/v3/http/api"
    // highlight-end
    "github.com/keepchen/go-sail/v3/sail/config"
)

const ErrNone = sailConstants.CodeType(200)   

var (
    conf = &config.Config{}
    option = &api.Option{
        Timezone:         constants.DefaultTimeZone,
        ErrNoneCode:      ErrNone,
        ErrNoneCodeMsg:   "SUCCESS",
        ForceHttpCode200: true,
    }
)

func main() {
    sail.
        WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(option).
        // highlight-end
        Hook(registerRoutes, nil, nil).
        Launch()
}
```  
## Error Codes  
The Go-Sail framework provides only a few error code constants. During business development, developers need to register their own error codes and error messages. Go-Sail's error code registration functionality supports internationalization. Developers need to follow the specification for registration to take effect.  
### Registration  
Here's a code example:  
```go title="examples/pkg/constants/errors.go" showLineNumbers  
import (
    "sync"
    sailConstants "github.com/keepchen/go-sail/v3/constants"
)

const (
    ErrNone                        = sailConstants.CodeType(200)   
    ErrStatusGatewayTimeoutTimeOut = sailConstants.CodeType(504)   
    ErrInternalSeverError          = sailConstants.CodeType(999999)
    ErrRequestParamsInvalid        = sailConstants.CodeType(100000)
    ErrAuthorizationTokenInvalid   = sailConstants.CodeType(100001)
    SliderValidationFailed         = sailConstants.CodeType(8026)  
)

var codeMsgMap = map[sailConstants.LanguageCode]map[sailConstants.ICodeType]string{
    //English
    sailConstants.LanguageEnglish: {
        ErrNone:                        "SUCCESS",
        ErrStatusGatewayTimeoutTimeOut: "Timeout",
        ErrInternalSeverError:          "Internal server error",
        ErrRequestParamsInvalid:        "Bad request parameters",
        ErrAuthorizationTokenInvalid:   "Token invalid",
        SliderValidationFailed:         "Slider validation failed",
    },
    //more...
}

var once sync.Once

func init() {
    once.Do(func() {
        go func() {
            time.Sleep(time.Second * 5)
            for lang, msgMap := range codeMsgMap {
                // highlight-start
                sailConstants.RegisterCodeTable(lang, msgMap)
                // highlight-end
            }
        }()
    })
}
```  
### Usage  
Now you can use them to respond:  
```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    // highlight-start
    "examples/pkg/constants"
    // highlight-end
)

func UserInfo(c *gin.Context) {
    ...
    // highlight-start
    sail.Response(c).Failure200(constants.SliderValidationFailed)
    // highlight-end
}
```

