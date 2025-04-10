---
sidebar_position: 2
---

# Lifecycle  
This chapter introduces the working principles and lifecycle of Go-Sail.  

## How it works  
Go-Sail's startup and shutdown follow a specific order, with different stages performing specific tasks.  

## Go-Sail Lifecycle  

### Initialize Configuration  
First, Go-Sail injects the necessary configurations into the program stack for subsequent use.  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var conf = &config.Config{}
```  
`config.Config{}` contains all the configuration items required by Go-Sail, which you can customize according to your needs.  
Let's take the HTTP service configuration as an example. You can set the port that the service listens on, configure whether the service runs in debug mode, enable Swagger documentation, and more.  
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

### Configure Startup Options  
Next, you need to configure the necessary startup options, which will determine how certain features of Go-Sail operate.  
#### API Options (Optional)  
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

#### Enable Websocket (Optional)  
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

#### Set Hook Functions (Optional)  
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
### Launch  
When the `Launch()` function is called, Go-Sail will execute the startup sequence and begin serving your application.  
Go-Sail will execute in the following **sequence**:  
- **Execute `beforeFunc` function (optional)**  
You can perform certain operations in this function. This function is called before the service starts.  
    :::warning    
    At this stage, components have not been initialized yet, so you cannot call any component instances within this function, otherwise it will panic.  
    :::
- **Initialize Components**  
At this stage, Go-Sail will start the corresponding components or services according to the contents of the user-specified configuration file. For example: initializing the logger library, initializing database connections, initializing Redis connections, etc.  

- **Initialize Router Engine (gin)**  
At this stage, Go-Sail will initialize the gin engine in preparation for subsequent route registration.  

- **Register WebSocket Service**  
At this stage, Go-Sail will establish WebSocket connections and register them with the router engine. Of course, this stage is optional.  

- **Start pprof**  
Only enabled when specified in the configuration file.  

- **Start Prometheus Metrics Collection**  
Only enabled when specified in the configuration file.  

- **Start Swagger Documentation Service**    
Only enabled when specified in the configuration file.  

- **Start Router Service and Listen for HTTP Requests**  

- **Print Overview Information to Terminal**  
It looks something like this:  
![screenshot](/img/launch.png)

- **Execute `afterFunc` Function (Optional)**  
    :::tip  
    At this stage, all components have been initialized. You can execute any desired functionality in this function, such as initializing database table structures, table data, scheduled tasks, etc.  
    :::

- **Listen for System Signals**  
At this stage, Go-Sail will continue to listen for system signals until it receives an exit signal, at which point it will execute the shutdown operation.  

- **Shutdown Components**  
After receiving an exit signal, Go-Sail will sequentially shut down all previously started components and services.  

- **Process Exit**  

## Request Lifecycle  
The request lifecycle represents the entire process of an HTTP request from arriving at the service node, through middleware processing, and finally returning a response. It describes the complete process and events that occur during this flow.  

### Router Middleware  
When a request reaches the service node, it first goes through a series of router middleware, where the request context is processed within these middleware.  

#### Log Trace  
First, when a request reaches the service node, it is monitored and captured by the gin engine. Then, Go-Sail takes over the request to a router middleware named `LogTrace`. In this middleware, necessary trace logging information will be injected into the context of subsequent access requests.  
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
#### Prometheus Exporter  
The Prometheus Exporter middleware injects numeric indicators related to request responses into the request context. This middleware works in conjunction with the Prometheus service.  
:::tip  
This middleware is optional, and you can enable or disable it through configuration files as needed.  
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
This middleware supports sampling system metrics, including CPU usage, memory usage, network transmission, disk load, etc. You can enable or disable it through configuration files as needed.  
:::  
#### Other Middleware  
Additionally, requests will pass through other middleware specified by developers, such as Cors, Gzip, etc. Of course, these middleware are optional and entirely determined by the developer.  

### Handler Functions  
After passing through a series of routing middleware, the request reaches the route handler function, which typically contains the specific business logic code.  
> The specific processing logic and steps are determined by the developers themselves.

Generally, there are several processing steps:  
#### Parameter Binding  
Bind request parameters to Go code.  
#### Parameter Validation  
Validate whether the request parameters meet the required conditions.  
#### Business Logic Processing  
Process business logic, such as querying records from the database that match the conditions based on request parameters.  
#### Response Return  
After processing the business logic, return the processing results to the client (the party that initiated the request).  

### Finally  
At this point, the entire process from the request reaching the service node, to processing, and finally to response is complete.  

