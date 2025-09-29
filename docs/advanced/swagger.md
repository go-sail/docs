---
sidebar_position: 3
---

# Swagger  
This chapter will introduce how to generate Swagger documentation.
## Introduction
API documentation is an essential component in project development. As a well-known open-source documentation generation tool, Swagger uses the Swag command-line tool in the Go ecosystem to generate documentation files by parsing code comments. Understanding commenting techniques can help you write easy-to-understand API documentation.
When Go-Sail starts, it will determine whether to enable Swagger documentation based on the configuration file. The documentation generation process needs to be handled by developers themselves. Below, we'll provide some simple examples to help you get started quickly.
## Preparation
First, you should install the following dependencies:  
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
## Code Comments
### VO
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/vo/request/getuserinforeqvo.go" showLineNumbers  
package request

import (
	"fmt"

	"github.com/keepchen/go-sail/v3/constants"
)

// GetUserInfoReqVo Request parameters for getting user information
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

// GetUserInfoAckVo Response structure for getting user information
// swagger: model
type GetUserInfoAckVo struct {
	dto.Base
	// Response body
	// in: body
	// required: true
	Data struct {
		User   UserInfo   `json:"user"`
		Wallet WalletInfo `json:"wallet"`
	} `json:"data" format:"object"`
}

// UserInfo Basic user information data structure
// swagger: model
type UserInfo struct {
	UserID int64 `json:"userId" validate:"required"` // User ID
	// User nickname
	// in: body
	// required: true
	Nickname string `json:"userInfo" validate:"required"`
	// Account status
	//
	// UserStatusCodeNormal    = UserStatusCode(0) //normal
	// UserStatusCodeForbidden = UserStatusCode(1) //forbidden
	//
	// in: body
	// required: true
	Status modelsEnum.UserStatusCode `json:"status" enums:"0,1" validate:"required"`
}

// WalletInfo Wallet information data structure
// swagger: model
type GetUserInfoAckVo struct {
	// Account balance
	// in: body
	// required: true
	Amount float64 `json:"amount" validate:"required"`
	// Wallet status
	//
	// WalletStatusCodeNormal    = WalletStatusCode(0) //normal
	// WalletStatusCodeForbidden = WalletStatusCode(1) //forbidden
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
### Routes  
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/routes/routes.go" showLineNumbers  
package routes

import (
	"net/http"

	"github.com/gin-contrib/gzip"

	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/middleware"

	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/http/handler"
)

// RegisterRoutes register routes
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
### Handler Functions
```go title="github.com/keepchen/go-sail/examples/pkg/app/user/http/handler/user.go" showLineNumbers  
package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/keepchen/go-sail/v3/examples/pkg/app/user/service"
)

// GetUserInfo Get user information
// @Tags        user / User Related
// @Summary     user/info - Get user information
// @Description Get user information
// @Security    ApiKeyAuth
// @Accept      application/json
// @Produce     json
// @Param       parameter query    request.GetUserInfoReqVo true "Query parameters"
// @Success     200   {object} response.GetUserInfoAckVo
// @Failure     400   {object} dto.Error400
// @Failure     500   {object} dto.Error500
// @Router      /user/info [get]
func GetUserInfo(c *gin.Context) {
	service.GetUserInfoSvc(c)
}
```  
### Service Functions  
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
### Generate Command
```shell  
swag init --dir pkg/app/user \
    --output pkg/app/user/http/docs \
    --parseDependency --parseInternal \
    --generalInfo user.go && \
redoc-cli bundle pkg/app/user/http/docs/*.yaml -o pkg/app/user/http/docs/docs.html
```  
After modifying the response path as needed, execute the generate command to generate the documentation content.
The above code example can be found in the source files at: [github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/examples).

## Plugins
### Redocly Copy Button
In the documentation pages generated by the Redocly tool, there is no button to quickly copy API routes, so we provide a plugin that can inject copy buttons into the generated HTML files.  
You can use it like this:
```shell  
node plugins/redocly/redocly-copy.js pkg/app/user/http/docs/*.html
```  
The source code for this tool can be found here: [github.com/keepchen/go-sail](https://github.com/keepchen/go-sail/tree/main/plugins).
## Makefile  
You can integrate the above commands into a Makefile to greatly improve efficiency.  
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
You can find a more complete example [here](https://github.com/keepchen/go-sail/blob/main/examples/Makefile).  
