---
sidebar_position: 2
---

# 日志追踪  
本章节将介绍在整个调用链中进行日志追踪。  
## 简介  
我们在[统一响应](../concepts/http-toolkit.md#统一响应)的章节中介绍了Go-Sail具有统一响应的数据结构，其中有一个字段是`requestId`，它就指明了本次请求的唯一标识，通过此标识符可以回溯整个调用过程。那么这是如何做到的呢？  
接下来我们就来进一步了解其中的原理。  
在[生命周期](../concepts/lifecycle.md)章节我们有介绍到，Go-Sail启动的时候，会注入一个名叫`LogTrace`的路由中间件，它在请求达到的时候，就向请求上下文注入了一系列的内容。包括请求编号、进入时间戳等。  
:::tip  
具体源码你可以在[这里](https://github.com/keepchen/go-sail/blob/main/http/middleware/logtrace.go)查看。
:::  
其中，LogTrace向上下文注入了一个带请求标识的logger实例，此实例可以被后续的调用链使用。  
## 使用  
在处理函数中使用：  
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
此时，带有唯一标识的请求日志已经从路由中间件传递到了处理函数，再由`NewUserSvcImpl`方法传递到了数据库操作层。可能你已经想到通过传递此logger，就可以轻松的将调用链串联起来。  
没错！就是如此。  
结合logger组件提供的导出器，你可以轻松的将日志输出到你想要的任何地方，比如ELK，然后在ELK的查询界面通过请求唯一标识查询即可获得完整的日志信息。  
:::tip  
如果你的服务处于微服务环境中，那么你还可以通过传递此唯一请求标识，将不同服务间的调用串联起来。  
此时你是否联想到了**zipkin**、**skywalking**之类的遥测工具了呢？  
:::