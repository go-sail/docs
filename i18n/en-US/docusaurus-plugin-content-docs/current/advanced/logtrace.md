---
sidebar_position: 1
---

# Log Tracing
This chapter will introduce log tracing across the entire call chain.
## Introduction
In the [Unified Response](../concepts/http-toolkit.md#unified-response) section, we introduced that Go-Sail has a unified response data structure, which includes a field called `requestId`. This field indicates the unique identifier for the current request, allowing us to trace back the entire call process. So how is this achieved?
Let's dive deeper into how this works.  
As mentioned in the [Lifecycle](../concepts/lifecycle.md) section, when Go-Sail starts up, it injects a router middleware called `LogTrace`. When a request arrives, this middleware injects a series of information into the request context, including the request ID, entry timestamp, and more.
:::tip  
You can view the specific source code [here](https://github.com/keepchen/go-sail/blob/main/http/middleware/logtrace.go).
:::  
Among them, LogTrace injects a logger instance with request identification into the context, which can be used by subsequent call chains.  
## Usage
Usage in handler functions:  
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
At this point, the request log with a unique identifier has been passed from the routing middleware to the handler function, and then passed to the database operation layer through the `NewUserSvcImpl` method. You may have already realized that by passing this logger, you can easily chain the calls together.  
That's right! This is exactly how it works.
With the exporters provided by the logger component, you can easily output logs to anywhere you want, such as ELK. Then you can query the complete log information through the unique request identifier in the ELK query interface.
:::tip  
If your service is in a microservices environment, you can pass this unique request identifier to chain together calls between different services.  
Does this remind you of telemetry tools like **zipkin** and **skywalking**?  
:::