---
sidebar_position: 2
---

# Swagger  
本章では、Swaggerドキュメントの生成方法について説明します。  
## はじめに  
プロジェクト開発において、インターフェースドキュメントは不可欠な重要な構成要素です。Swaggerはオープンソースコミュニティで非常に有名なドキュメント生成ツールであり、Go言語のエコシステムでは、Swagコマンドラインツールがコードコメントを解析してドキュメントファイルを生成します。コメントの書き方を理解することで、理解しやすいインターフェースドキュメントを作成することができます。  
Go-Sailは起動時に設定ファイルに基づいてSwaggerドキュメントを有効にするかどうかを決定します。ドキュメントの生成プロセスは開発者自身が処理する必要があります。以下では、すぐに使い始められるように、いくつかの簡単な例を示します。  
## 準備  
まず、以下の依存関係をインストールする必要があります：  
### Swag  
> [docs](https://github.com/swaggo/swag)  

```shell showLineNumbers  
go get -u github.com/swaggo/swag/cmd/swag@v1.16.4
```  

### Node  
> [docs](https://nodejs.org/)  

### Redocly  
> [docs](https://redocly.com/docs/cli/)  

```shell showLineNumbers  
npm i -g @redocly/cli@v1.11.0
```  
## コードコメント  
### VO
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/vo/request/getuserinforeqvo.go" showLineNumbers  
package request

import (
	"fmt"

	"github.com/keepchen/go-sail/v3/constants"
)

// GetUserInfoReqVo ユーザー情報取得リクエストパラメータ  
// swagger: model
type GetUserInfoReqVo struct {
	UserID int64 `json:"userId" form:"userId" validate:"required"` // ユーザーID
}

func (v GetUserInfoReqVo) Validator() (constants.ICodeType, error) {
	if v.UserID < 1 {
		return constants.ErrRequestParamsInvalid, fmt.Errorf("field [userId], value:{%d} is invalid", v.UserID)
	}

	return constants.ErrNone, nil
}
```  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/vo/response/getuserinfoackvo.go" showLineNumbers  
package response

import (
	modelsEnum "github.com/keepchen/go-sail/v3/examples/pkg/common/enum/models"
	"github.com/keepchen/go-sail/v3/http/pojo/dto"
)

// GetUserInfoAckVo ユーザー情報取得レスポンスデータ構造  
// swagger: model
type GetUserInfoAckVo struct {
	dto.Base
	// データ本体
	// in: body
	// required: true
	Data struct {
		User   UserInfo   `json:"user"`
		Wallet WalletInfo `json:"wallet"`
	} `json:"data" format:"object"`
}

// UserInfo ユーザーの基本情報データ構造
// swagger: model
type UserInfo struct {
	UserID int64 `json:"userId" validate:"required"` // ユーザーID
	// ユーザーのニックネーム
	// in: body
	// required: true
	Nickname string `json:"userInfo" validate:"required"`
	// アカウントステータス
	//
	// UserStatusCodeNormal    = UserStatusCode(0) //通常
	// UserStatusCodeForbidden = UserStatusCode(1) //無効
	//
	// in: body
	// required: true
	Status modelsEnum.UserStatusCode `json:"status" enums:"0,1" validate:"required"`
}

// GetUserInfoAckVo ウォレット情報のデータ構造
// swagger: model
type GetUserInfoAckVo struct {
	// アカウント残高
	// in: body
	// required: true
	Amount float64 `json:"amount" validate:"required"`
	// ウォレットステータス
	//
	// WalletStatusCodeNormal    = WalletStatusCode(0) //通常
	// WalletStatusCodeForbidden = WalletStatusCode(1) //無効
	//
	// in: body
	// required: true
	Status modelsEnum.WalletStatusCode `json:"status" enums:"0,1" validate:"required"`
}

func (v GetUserInfoAckVo) GetData() interface{} {
	return v.Data
}

var _ dto.IResponse = &GetUserInfoAckVo{}
```  
### ルーティング  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/routes/routes.go" showLineNumbers  
package routes

import (
	"net/http"

	"github.com/gin-contrib/gzip"

	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/middleware"

	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/handler"
)

// RegisterRoutes ルートを登録する  
func RegisterRoutes(r *gin.Engine) {
	//k8sヘルスチェックエンドポイント
	r.GET("/actuator/health", func(c *gin.Context) {
		c.String(http.StatusOK, "%s", "ok")
	})
	apiGroup := r.Group("/api/v1")
	{
		apiGroup.GET("/say-hello", handler.SayHello)
		userGroup := apiGroup.Group("/user")
		{
			userGroup.Use(middleware.AuthCheck()).GET("/info", handler.GetUserInfo)
		}
	}
}
```  
### ハンドラー関数  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/handler/user.go" showLineNumbers  
package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/service"
)

// GetUserInfo ユーザー情報を取得する
// @Tags        user / ユーザー関連
// @Summary     user/info - ユーザー情報を取得する
// @Description ユーザー情報を取得する
// @Security    ApiKeyAuth
// @Accept      application/json
// @Produce     json
// @Param       parameter query    request.GetUserInfoReqVo true "クエリパラメータ"
// @Success     200   {object} response.GetUserInfoAckVo
// @Failure     400   {object} dto.Error400
// @Failure     500   {object} dto.Error500
// @Router      /user/info [get]
func GetUserInfo(c *gin.Context) {
	service.GetUserInfoSvc(c)
}
```  
### ロジック関数  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/service/sayhello.go" showLineNumbers  
package service

import (
	"fmt"

	"github.com/keepchen/go-sail/v3/sail"

	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/constants"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/vo/request"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/vo/response"
)

func SayHelloSvc(c *gin.Context) {
	var (
		form request.SayHelloReqVo
		resp response.SayHelloAckVo
	)
	if err := c.ShouldBind(&form); err != nil {
		sail.Response(c).Wrap(constants.ErrRequestParamsInvalid, resp).Send()
		return
	}

	if errorCode, err := form.Validator(); err != nil {
		sail.Response(c).Wrap(errorCode, resp, err.Error()).Send()
		return
	}

	var nickname string
	if len(form.Nickname) == 0 {
		nickname = "go-sail"
	} else {
		nickname = form.Nickname
	}

	resp.Data = fmt.Sprintf("hello, %s", nickname)

	sail.Response(c).Wrap(constants.ErrNone, resp).Send()
	//sail.Response(c).Data(resp.Data)
}
```  
### 生成コマンド  
```shell  
swag init --dir pkg/app/user \
    --output pkg/app/user/http/docs \
    --parseDependency --parseInternal \
    --generalInfo user.go && \
redoc-cli bundle pkg/app/user/http/docs/*.yaml -o pkg/app/user/http/docs/docs.html
```  
必要に応じて応答パスを変更した後、generateコマンドを実行すると、ドキュメントが生成されます。  
上記のコード例は、ソースファイルで確認できます：[github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/examples)。

## プラグイン  
### Redoclyのコピーボタン  
Redoclyツールで生成されたドキュメントページには、APIルートを素早くコピーするためのボタンがないため、生成されたHTMLファイルにコピーボタンを注入するプラグインを提供しています。  
次のように使用できます：  
```shell  
node plugins/redocly/redocly-copy.js pkg/app/user/http/docs/*.html
```  
このツールのソースコードは[github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/plugins)で確認できます。  
## Makefile  
上記のコマンドをMakefileに統合することで、使用効率を大幅に向上させることができます。  
```Makefile title="Makefile" showLineNumbers  
# swag version >= 1.16.4
# go get -u github.com/swaggo/swag/cmd/swag@v1.16.4
gen-swag-user:
	@echo "+ $@"
	@$(if $(SWAG), , \
		$(error Please install swag cli, using go: "go get -u github.com/swaggo/swag/cmd/swag@v1.16.4"))
	@$(if $(REDOCCLI), , \
            		$(error Please install redoc cli, using npm or yarn: "npm i -g @redocly/cli@v1.11.0"))
	swag init --dir pkg/app/user \
 		--output pkg/app/user/http/docs \
 		--parseDependency --parseInternal \
 		--generalInfo user.go && \
 	redoc-cli bundle pkg/app/user/http/docs/*.yaml -o pkg/app/user/http/docs/docs.html && \
 	node plugins/redocly/redocly-copy.js pkg/app/user/http/docs/*.html
```  
より完全な例は[こちら](https://github.com/keepchen/go-sail/blob/main/examples/Makefile)で確認できます。  
