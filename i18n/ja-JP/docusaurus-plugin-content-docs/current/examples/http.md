---
sidebar_position: 12
---  
# HTTP  
本章ではHTTPリクエストとレスポンスの全体的な流れについて説明します。  
## はじめに  
HTTPリクエストとレスポンスの過程において、リクエストがサービスノードに到達してから、処理フローを経て、最後にリクエスト元にレスポンスを返すまで、各ステップで必要に応じて処理が行われます。  

## リクエスト  
### ルーティングミドルウェア  
ルーティングミドルウェアは、リクエスト呼び出しチェーン全体でフィルタリング、インターセプト、コンテキスト管理の役割を果たします。一般的に認証などに使用され、通常はリクエストが到達した後の最初の位置、つまり処理関数の前に配置されます。  

では、シンプルな認証ミドルウェアを実装してみましょう。  
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
これをルートに登録します。  
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
### エンティティ  
リクエストエンティティはリクエストパラメータのデータ構造を定義し、後続のパラメータ処理に明確なデータ型を提供します。そのため、明示的に定義することを推奨します。また、内部データが要件を満たしているかを検証するための拡張検証メソッドも定義します。  
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
## ビジネスロジック  
### パラメータのバインド  
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
### パラメータの検証  
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
### ハンドラ関数  
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
## レスポンス  
### エンティティ  
レスポンスエンティティは、返却データのデータ構造を定義し、後続のレスポンス処理に明確なデータ型を提供します。そのため、明示的に定義することを推奨します。  
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
### レスポンス  
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
## シンタックスシュガー  
シンタックスシュガーは、より豊富なレスポンス関数を提供します。  
```go showLineNumbers  
sail.Response(c).Data(nil)

sail.Response(c).Success()

sail.Response(c).Failure()

sail.Response(c).Failure("failed")

sail.Response(c).Failure400()

sail.Response(c).Failure500()

sail.Response(c).Wrap(constants.XXX, anyValue, "SUCCESS").Send()
```  

## APIオプション  
APIオプションを使用すると、開発者はレスポンスハンドラの動作をカスタマイズできます。  
このオプションはフレームワーク起動時に設定されます：  
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
## エラーコード  
Go-Sailフレームワークは少数のエラーコード定数のみを提供します。ビジネス開発の過程で、開発者は独自のエラーコードとエラーメッセージを登録する必要があります。Go-Sailが提供するエラーコード登録機能は国際化をサポートしています。開発者は規定に従って登録を行う必要があります。  
### 登録  
以下にコード例を示します：  
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
### 使い方  
これらを使用してレスポンスを返すことができます：  
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

