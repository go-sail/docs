---
sidebar_position: 3
---

# Swagger  
本章节将介绍如何生成Swagger文档。  
## 简介  
在项目开发过程中，接口文档是不可或缺的重要组成部分。Swagger作为开源界非常著名的文档生成工具，在Go语言生态中，Swag命令行工具通过解析代码注释来生成文档文件。了解注释技巧可以帮助你编写易于理解的接口文档。  
Go-Sail启动时会根据配置文件决定是否启动Swagger文档，生成文档的过程需要开发者自己处理。下面我们给出一些简单的示例，帮助您快速入门。  
## 准备  
首先，你应该安装好以下的这些依赖：  
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
## 代码注释  
### VO
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/vo/request/getuserinforeqvo.go" showLineNumbers  
package request

import (
	"fmt"

	"github.com/keepchen/go-sail/v3/constants"
)

// GetUserInfoReqVo 获取用户信息请求参数
// swagger: model
type GetUserInfoReqVo struct {
	UserID int64 `json:"userId" form:"userId" validate:"required"` // 用户id
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

// GetUserInfoAckVo 获取用户信息返回数据结构
// swagger: model
type GetUserInfoAckVo struct {
	dto.Base
	// 数据体
	// in: body
	// required: true
	Data struct {
		User   UserInfo   `json:"user"`
		Wallet WalletInfo `json:"wallet"`
	} `json:"data" format:"object"`
}

// UserInfo 用户基础信息数据结构
// swagger: model
type UserInfo struct {
	UserID int64 `json:"userId" validate:"required"` // 用户id
	// 用户昵称
	// in: body
	// required: true
	Nickname string `json:"userInfo" validate:"required"`
	// 账号状态
	//
	// UserStatusCodeNormal    = UserStatusCode(0) //正常
	// UserStatusCodeForbidden = UserStatusCode(1) //禁用
	//
	// in: body
	// required: true
	Status modelsEnum.UserStatusCode `json:"status" enums:"0,1" validate:"required"`
}

// GetUserInfoAckVo 钱包信息数据结构
// swagger: model
type GetUserInfoAckVo struct {
	// 账户余额
	// in: body
	// required: true
	Amount float64 `json:"amount" validate:"required"`
	// 钱包状态
	//
	// WalletStatusCodeNormal    = WalletStatusCode(0) //正常
	// WalletStatusCodeForbidden = WalletStatusCode(1) //禁用
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
### 路由  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/routes/routes.go" showLineNumbers  
package routes

import (
	"net/http"

	"github.com/gin-contrib/gzip"

	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/middleware"

	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/handler"
)

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.Engine) {
	//k8s健康检查接口
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
### 处理函数  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/handler/user.go" showLineNumbers  
package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/service"
)

// GetUserInfo 获取用户信息
// @Tags        user / 用户相关
// @Summary     user/info - 获取用户信息
// @Description 获取用户信息
// @Security    ApiKeyAuth
// @Accept      application/json
// @Produce     json
// @Param       parameter query    request.GetUserInfoReqVo true "查询参数"
// @Success     200   {object} response.GetUserInfoAckVo
// @Failure     400   {object} dto.Error400
// @Failure     500   {object} dto.Error500
// @Router      /user/info [get]
func GetUserInfo(c *gin.Context) {
	service.GetUserInfoSvc(c)
}
```  
### 逻辑函数  
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
### 生成指令  
```shell  
swag init --dir pkg/app/user \
    --output pkg/app/user/http/docs \
    --parseDependency --parseInternal \
    --generalInfo user.go && \
redoc-cli bundle pkg/app/user/http/docs/*.yaml -o pkg/app/user/http/docs/docs.html
```  
根据需要修改响应路径后，执行generate命令，就会生成文档内容。
上面的代码示例可以在源文件中找到：[github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/examples).  

## 插件  
### Redocly的复制按钮  
在Redocly工具生成的文档页面中，没有可以快速复制接口路由的按钮，因此我们提供了一个插件，可以将复制按钮注入到生成的html文件中。  
你可以这样使用它：  
```shell  
node plugins/redocly/redocly-copy.js pkg/app/user/http/docs/*.html
```  
该工具的源代码可以在这里找到：[github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/plugins)。  
## Makefile  
可以将以上命令集成到Makefile中，可以极大的提高使用效率。  
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
您可以在[此处](https://github.com/keepchen/go-sail/blob/main/examples/Makefile)找到更完整的示例。    
