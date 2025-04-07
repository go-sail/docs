---
sidebar_position: 2
---

# 生命周期  
本章节介绍Go-Sail的工作原理及生命周期。  

## 它是如何工作的  
Go-Sail的启停是有一定顺序的，不同阶段会做具体的事情。  

## Go-Sail的生命周期  

### 初始化配置  
首先，Go-Sail 会将必要的配置注入到程序堆栈中以供后续使用。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var conf = &config.Config{}
```  
`config.Config{}`配置包含Go-Sail所需的完整配置项，您可以根据需要设置内容。  
我们以http服务的配置为例。 可以设置服务监听的端口、设置服务是否运行在debug模式、是否启用Swagger文档等。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        // highlight-start
        HttpServer: config.HttpServerConf{
            Debug: true,
            Addr:  ":8000",
        },
        // highlight-end
    }
)

func main() {
    sail.
        // highlight-start
        WakeupHttp("go-sail", conf).
        // highlight-end
        Hook(registerRoutes, nil, nil).
        Launch()
}
```  

### 设置启动项  
其次，您需要设置必要的启动项，这将决定Go-Sail的某些功能如何运行。  
#### Api选项 (非必须的)  
```go title="main.go" showLineNumbers  
import (
    // highlight-start
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/http/api"
    // highlight-end
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        HttpServer: config.HttpServerConf{
            Debug: true,
            Addr:  ":8000",
        },
    }
)

func main() {
    sail.
        WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(&api.Option{
                Timezone:         constants.DefaultTimeZone,
                ErrNoneCode:      constants.ErrNone,
                ErrNoneCodeMsg:   "SUCCESS",
                ForceHttpCode200: true,
            }).
        // highlight-end
        Hook(registerRoutes, nil, nil).
        Launch()
}
```  

#### 启用Websocket (非必须的)  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        HttpServer: config.HttpServerConf{
            Debug: true,
            Addr:  ":8000",
        },
    }
)

func main() {
    sail.
        WakeupHttp("go-sail", conf).
        // highlight-start
        EnableWebsocket(nil, nil, nil).
        // highlight-end
        Hook(registerRoutes, nil, nil).
        Launch()
}
```  

#### 设置勾子函数 (非必须的)  
```go title="main.go" showLineNumbers  
import (
    // highlight-start
    "github.com/gin-gonic/gin"
    // highlight-end
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        LoggerConf: logger.Conf{
            Filename: "logs/running.log",
        },
        HttpServer: config.HttpServerConf{
            Debug: true,
            Addr:  ":8000",
        },
    }
    // highlight-start
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            c.String(http.StatusOK, "%s", "hello, world!")
        })
    }
    beforeFunc = func() {
        fmt.Println("call user function [before] to do something...")
    }
    afterFunc = func() {
        fmt.Println("call user function [after] to do something...")
    }
    // highlight-end
)

func main() {
    sail.WakeupHttp("go-sail", conf).
        // highlight-start
        Hook(registerRoutes, beforeFunc, afterFunc).
        // highlight-end
        Launch()
}
```  
### 启动  
当调用 `Launch()` 函数时，Go-Sail 将执行启动命名并开始为您服务。  
Go-Sail将按照下列步骤**顺序**执行:  
- **执行`beforeFunc`函数 (非必须的)**  
您可以在此函数中执行某些操作。该函数在服务启动之前被调用。  
    :::warning    
    这个阶段，组件还没有被初始化，所以这个函数内不能调用任何组件实例，否则会panic。
    :::
- **启动组件**  
此阶段Go-Sail将根据用户指定配置文件的内容启动相应的组件或服务。例如：初始化日志库、初始化数据库连接、初始化Redis连接等。  

- **初始化路由引擎 (gin)**  
此阶段Go-Sail将初始化gin引擎，为后续的路由注册做准备。  

- **注册Websocket服务**  
在此阶段Go-Sail将发起Websocket连接并向路由引擎注册。当然，这个阶段是非必须的。  

- **启动pprof**  
仅在配置文件中指定时启用。  

- **启动Prometheus指标收集**  
仅在配置文件中指定时启用。  

- **启动Swagger文档服务**    
仅在配置文件中指定时启用。  

- **启动路由服务并监听http请求**  

- **打印概览信息到终端**  
大概长这样：  
![screenshot](/img/launch.png)

- **执行`afterFunc`函数 (非必须的)**  
    :::tip  
    这个阶段相关组件已经初始化完毕，你可以在这个函数中执行你想要的功能，比如初始化数据库表结构、表数据、定时任务等。
    :::

- **监听系统信号**  
此阶段Go-Sail会继续监听系统信号，直到收到退出信号后才会执行退出操作。  

- **关闭组件**  
Go-Sail收到退出信号后，会依次关闭之前启动的组件或服务。  

- **整个进程退出**  

## 请求生命周期  
请求生命周期代表了一个http请求从到达服务节点，到中间处理，最后到最终返回响应的整个过程。它描述了整个过程和发生的事件。  

### 路由中间件  
当一个请求到达服务节点时，首先会经过一系列的路由中间件，请求的上下文会在这些中间件中进行处理。  

#### 链路日志追踪  
首先，当请求到达服务节点时，会被gin引擎监听并捕获。 然后，Go-Sail会将请求接管到名为`LogTrace`的路由中间件。 在这个中间件中，将注入一些必要的链路日志追踪信息。进入后续访问请求的上下文中。  
```go title="github.com/keepchen/go-sail/sail/httpserver/gin.go" showLineNumbers  
import (
    // highlight-start
    "github.com/keepchen/go-sail/v3/http/middleware"
    // highlight-end
    "github.com/gin-gonic/gin"
)

func InitGinEngine(conf config.HttpServerConf) *gin.Engine {
    var r *gin.Engine

    ...

    // highlight-start
    r.Use(middleware.LogTrace())
    // highlight-end

    ...
}
```  
#### Prometheus导出器  
Prometheus导出器中间件会将一些有关请求响应的数字指示符注入到请求上下文中。该中间件将与Prometheus服务结合使用。  
:::tip  
该中间件是非必须的，您可以根据需要通过指定配置文件来启用或禁用它。
:::  
```go title="github.com/keepchen/go-sail/sail/httpserver/gin.go" showLineNumbers  
import (
    // highlight-start
    "github.com/keepchen/go-sail/v3/http/middleware"
    // highlight-end
    "github.com/gin-gonic/gin"
)

func InitGinEngine(conf config.HttpServerConf) *gin.Engine {
    var r *gin.Engine

    ...

    // highlight-start
    if conf.Prometheus.Enable {
        r.Use(middleware.PrometheusExporter())
    }
    // highlight-end

    ...
}
```  
:::tip  
该中间件支持对系统指标进行采样，包括CPU占用率、内存占用率、网络传输、磁盘负载等等，您可以根据需要通过指定配置文件来启用或禁用它。
:::  
#### 其他中间件  
另外，请求还会经过一些其他的中间件，这些中间件是开发者指定的，比如Cors、Gzip等。当然，这些中间件也是非必须的，完全由开发者指定。  

### 处理函数  
请求经过一系列路由中间件后，会到达路由处理函数，通常是具体的业务处理代码。  
> 具体的处理逻辑和步骤由开发人员自己决定。  

一般有以下几个处理步骤：  
#### 参数绑定  
将请求参数绑定到go代码中。  
#### 参数校验  
验证请求参数是否满足条件。  
#### 业务处理  
处理业务逻辑，如根据请求参数查询数据库中符合条件的记录等。  
#### 返回响应  
处理完业务逻辑后，将处理结果响应给客户端（发起请求的一方）。  

### 最后  
至此，请求从到达服务节点，到处理，最后到响应的整个流程就完成了。  

