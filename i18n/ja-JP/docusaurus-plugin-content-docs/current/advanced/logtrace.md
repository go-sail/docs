---
sidebar_position: 2
---

# ログトレース  
本章では、コール チェーン全体でのログ トレースについて説明します。  
## はじめに  
[統一された対応](../concepts/http-toolkit.md#統一された対応)の章で説明したように、Go-Sailには統一されたレスポンスデータ構造があり、その中に`requestId`というフィールドがあります。これはリクエストの一意の識別子を示し、この識別子を使用して呼び出し全体のプロセスを追跡できます。では、これはどのように実現されているのでしょうか？  
次に、その仕組みについてさらに詳しく見ていきましょう。  
[ライフサイクル](../concepts/lifecycle.md)の章で説明したように、Go-Sailの起動時に`LogTrace`というルーティングミドルウェアが注入され、リクエストが到着したときにリクエストコンテキストに一連の情報が注入されます。これにはリクエストID、入力タイムスタンプなどが含まれます。  
:::tip  
具体的なソースコードは[こちら](https://github.com/keepchen/go-sail/blob/main/http/middleware/logtrace.go)で確認できます。  
:::  
その中で、LogTraceはリクエストIDを持つロガーインスタンスをコンテキストに注入し、このインスタンスは後続の呼び出しチェーンで使用できます。  
## 使い方  
ハンドラー関数での使用：  
```go title="examples/pkg/app/user/handler/userinfo.go" showLineNumbers  
package handler

import (
    "errors"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/vo/request"
    "github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/vo/response"
    userSvc "examples/pkg/common/db/service/user"
    "github.com/keepchen/go-sail/v3/lib/logger"
    "go.uber.org/zap"
    "gorm.io/gorm"
)

func GetUserInfoSvc(c *gin.Context) {
    var (
        ...
        // highlight-start
        loggerSvc = sail.LogTrace(c).GetLogger()
        // highlight-end
        ...
    )
    if err := c.ShouldBind(&form); err != nil {
        sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil).Send()
        return
    }

    if errorCode, err := form.Validator(); err != nil {
        sail.Response(c).Wrap(errorCode, nil, err.Error()).Send()
        return
    }

    // highlight-start
    user, sqlErr := userSvc.NewUserSvcImpl(sail.GetDBR(), sail.GetDBW(), loggerSvc).GetUser(form.UserID)
    // highlight-end
    if sqlErr != nil && errors.Is(sqlErr, gorm.ErrRecordNotFound) {
        sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, nil, "user not found").Send()
        return
    }

    ...

    sail.Response(c).Wrap(constants.ErrNone, resp).Send()
}
```  
この時点で、一意の識別子を持つリクエストログはルーティングミドルウェアからハンドラー関数に渡され、さらに`NewUserSvcImpl`メソッドを通じてデータベース操作レイヤーに渡されます。このロガーを渡すことで、呼び出しチェーンを簡単に連携できることにお気づきかもしれません。  
その通りです！まさにそうです。  
ロガーコンポーネントが提供するエクスポーターと組み合わせることで、ELKなど任意の場所に簡単にログを出力できます。その後、ELKのクエリインターフェースでリクエストの一意の識別子を使用してクエリを実行することで、完全なログ情報を取得できます。  
:::tip  
サービスがマイクロサービス環境にある場合、この一意のリクエスト識別子を渡すことで、異なるサービス間の呼び出しを連携させることができます。  
この時点で、**Zipkin**や**SkyWalking**などのテレメトリーツールを思い浮かべたのではないでしょうか？   
:::