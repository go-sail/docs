---
sidebar_position: 1
---  
# 配置  
本章节将介绍配置项如何使用。  

## 简介  
配置是启动整个Go-Sail服务的关键之一。它决定了Go-Sail的工作方式。  

在前面我们提到了最快启动Go-Sail的方式，也就是下面的代码：  
```go title="main.go" showLineNumbers  
import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            c.String(http.StatusOK, "%s", "hello, world!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
上面的代码做了以下的事情：  
- 1.以最小化的配置项启动Go-Sail服务  
- 2.所有配置项用的是框架默认配置  
- 3.注册了一个路径名为`/hello`的路由处理函数  

Go-Sail的配置大致可以分为两大类，一类是HTTP服务配置项，一类则是组件库配置项。下面我们来分别了解它们是如何使用的。  

## HTTP服务  
HTTP服务配置项包含是否开启DEBUG模式，服务监听地址，Swagger文档，Prometheus和Websocket。  
那么，我们现在可以更加明确指定这些配置项的具体内容。  

### 监听及调试    
#### HTTP服务  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        // highlight-start
        Debug: true,
        Addr: ":8000",
        // highlight-end
    }
    ...
)

...
```  
值得一提的是关于DEBUG配置项所影响的范围：  
- 为true会以debugMode的方式启动gin，反之则以releaseMode的方式启动，且不再用彩色终端输出方案。  
- 为true会启动Pprof检测，反之则不启动。  
- 为true会额外注册路径名为`/go-sail`的路由处理函数，反之则不注册。  

:::warning  
我们**强烈建议**在生产环境将`Debug`的值设置为`false`！
:::  
#### Websocket服务  
Websocket服务是可选项，当你需要时可以选择启用它。通过下面的配置，指定客户端连接Websocket服务的路由地址。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        
        Debug: true,
        Addr: ":8000",
        Swagger: config.SwaggerConf{
            Enable: true,
            RedocUIPath: "...",
            JsonPath: "",
            FaviconPath: "",
        },
        Prometheus: config.PrometheusConf{
            ...
        },
        // highlight-start
        WebSocketRotePath: "/notification/push",
        // highlight-end
    }
    ...
)

...
```  
与此同时，你需要在启动框架的时候，指定启动Websocket服务，就像下面这样。  
```go title="main.go" showLineNumbers  
import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            c.String(http.StatusOK, "%s", "hello, world!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).
    // highlight-start
    EnableWebsocket(nil, nil).
    // highlight-end
    Hook(registerRoutes, nil, nil).
    Launch()
}
```  
这样，默认的Websocket服务就启动成功了。  
:::tip  
默认的Websocket服务只会打印客户端发送的信息，不会做其他任何的操作。因此，自定义的连接逻辑和处理函数需要你指定`EnableWebsocket`方法的入参。  
:::

### Swagger  
Swagger是否启用是放在`config.SwaggerConf`配置下的，这么设计为的就是能为开发者提供更加细粒度的控制。你可以单独的选择启用与否。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        
        Debug: true,
        Addr: ":8000",
        // highlight-start
        Swagger: config.SwaggerConf{
            Enable: true,
            RedocUIPath: "...",
            JsonPath: "...",
            FaviconPath: "...",
        },
        // highlight-end
        Prometheus: config.PrometheusConf{
            ...
        },
        WebSocketRotePath: "...",
    }
    ...
)

...
```  

#### RedocUIPath  
`RedocUIPath`是指定使用Redocly文档工具生成的html文件地址，当正确指定后，Go-Sail会帮你管理Redocly文档UI的路由，同时在启动后，你可以在终端输出信息中直接找到它们。  
:::tip  
Redocly是一个优秀的第三方文档UI生成工具，它提供了以命令行的方式快速的将符合openapi规范的yaml文件直接生成为html文件。

> 假设  
> 你的yaml文件地址为**pkg/app/ucenter/docs/*.yaml**，最终生成的html路径为**pkg/app/ucenter/docs/apidoc.html**  

运行下面的命令后，你将得到一个Redocly UI风格的html文件。  
```shell  
redocly build-docs pkg/app/ucenter/docs/*.yaml -o pkg/app/ucenter/docs/apidoc.html  
```  

此时，将`RedocUIPath`配置为**pkg/app/ucenter/docs/apidoc.html**即可。  
:::  

#### JsonPath  
`JsonPath`则是Swagger UI需要的json文件路径。  
以上面的为例，将`JsonPath`配置为**pkg/app/ucenter/docs/swagger.json**即可。  

#### FaviconPath  
`FaviconPath`提供了浏览器页签徽标路径，当你的文档需要公开且需要注意品牌形象时，这个配置将变得有用。当然，没有配置它也没关系，Go-Sail会显示框架本身的Logo作为徽标。  

### Prometheus  
Prometheus是否启用是放在`config.PrometheusConf`配置下的，这么设计为的就是能为开发者提供更加细粒度的控制。你可以单独的选择启用与否。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{
        
        Debug: true,
        Addr: ":8000",
        
        Swagger: config.SwaggerConf{
            Enable: true,
            RedocUIPath: "...",
            JsonPath: "",
            FaviconPath: "",
        },
        // highlight-start
        Prometheus: config.PrometheusConf{
            Enable: true,
            Addr: ":8001",
            AccessPath: "/metrics",
            DisableSystemSample: false,
            DiskPath: "/data",
            SampleInterval: "30s",
        },
        // highlight-end
        WebSocketRotePath: "...",
    }
    ...
)

...
```  
上面的配置项指定了需要启动Prometheus指标采集，监听端口为`8001`，访问路径为`/metrics`，需要进行系统指标采样，磁盘占用率采样收集`/data`目录下的数据，系统采样间隔为`30秒`。  
:::tip  
注意，Prometheus是单独启动的HTTP服务，因此你需要配置一个与业务服务不同的端口。这样做的目的是为了能做更好的权限管理，比如业务服务对外开放而指标采集是私有的仅对内部服务开放。  
:::  

## 组件库  
每一个组件库都有一个单独的`Enable`配置项，用于控制该组件是否启用。如果设置为`true`，Go-Sail在启动的时候，按照配置去尝试初始化。  
:::tip  
前面提到，一般来讲，组件库是以单例的方式提供访问的，因此组件配置是不支持热更新的，除非有特殊说明。  
:::  
:::warning  
注意，如果你启用了某组件，但是该组件初始化失败了，服务会终止并退出。例如数据连接失败等。  
:::  

### Logger  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/logger"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        LoggerConf: logger.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  

:::tip  
特别说明，Logger的导出器目前支持Redis(standalone和cluster模式)、Nats、Kafka。  
若启用导出器，那么它们的连接实例与使用`sail.GetXX`获取到的实例是相互独立的，并不相关。  
:::

### Database    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/db"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        DBConf: db.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  

### Redis   
#### Standalone单实例  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/redis"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        RedisConf: redis.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
#### Cluster集群  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/redis"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        RedisClusterConf: redis.ClusterConf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
### Nats  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/nats"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        NatsConf: nats.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
### Email    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/email"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        EmailConf: email.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
### Kafka    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/kafka"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        KafkaConf: kafka.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
### Etcd    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/etcd"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        EtcdConf: etcd.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  
### Jwt    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
    // highlight-start
    "github.com/keepchen/go-sail/lib/jwt"
    // highlight-end
)

var (
    conf = &config.Config{
        ...
        // highlight-start
        JwtConf: jwt.Conf{
            ...
        },
        // highlight-end
        ...
    }
    ...
)

...
```  

## 解析  
在实际的使用场景下，配置项不会硬编码逐个设置，一般来讲会通过诸如Nacos、Etcd甚至文件等其他途径读取，然后解析。在config包中，Go-Sail为开发者提供了简单的解析方法，开发者可以选择性地使用，目前Go-Sail支持`yaml`，`toml`，`json`三种较为流行的格式。  
### 默认模板  
当你的工程项目是全新的时候，此时并没有配置文件。Go-Sail为开发者提供了打印默认配置并输出到文件的功能，这样即可快速得到一个配置文件模板。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    //format: json
    config.PrintTemplateConfig("json", "path/to/config.json")
    //format: yaml
    config.PrintTemplateConfig("yaml", "path/to/config.yaml")
    //format: toml
    config.PrintTemplateConfig("toml", "path/to/config.toml")
}
```  
### 从源字符串解析  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    //json
    conf, err := config.ParseConfigFromBytes("json", sourceBytes)
    //yaml
    conf, err := config.ParseConfigFromBytes("yaml", sourceBytes)
    //toml
    conf, err := config.ParseConfigFromBytes("toml", sourceBytes)
}
```  
### 从Etcd解析
如果你使用[Etcd](https://etcd.io/)，Go-Sail提供的便捷方法可以帮助你从Etcd配置中心读取和监听配置信息。  

```go title="main.go" showLineNumbers  
import (
    "context"
    "github.com/keepchen/go-sail/v3/lib/etcd"
    "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    conf := etcd.Conf{
        ...
    }
    etcd.Init(conf)

    //get key-value
    etcd.GetInstance().KV.Get()

    //watch key-value
    callback := func(k, v []byte()) {
        ...
    }
    ctx := context.Background()
    etcd.Watch(ctx, "key", callback)
}
```  
### 从Nacos解析
如果你使用[Nacos](https://nacos.io)，Go-Sail提供的便捷方法可以帮助你从Nacos配置中心读取和监听配置信息。  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/nacos"
    "github.com/keepchen/go-sail/v3/sail/config"
)

func main() {
    nacos.InitClient("appName", "nacos endpoints", "nacos namespace id")

    var conf = &config.Config{}

    //get config and parse config to go struct
    err = nacos.GetConfig("group", "dataID", conf, "yaml")

    callback := func(namespace, group, dataId, data string) {
        err := nacos.ParseConfig([]byte(data), conf, "yaml")
        if err != nil {
            fmt.Printf("<Nacos> listen config {%s:%s} change,but can't be unmarshal: %s\n", group, dataId, err.Error())
            return
        }
    }

    //listening config if it changed
    err = nacos.ListenConfigWithCallback(group, dataID, callback)
    if err != nil {
        panic(err)
    }
}
```  
## 嵌套组合  
Go-Sail的配置文件只会包含框架本身必要的配置项。在实际项目中，往往会伴随其他业务相关的配置项。因此，我们需要对配置项进行组合或嵌套来满足实际需求。  
例如：  
### 具名组合
```go title="main.go" showLineNumbers  
import (
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"
)

type GlobalConfigNamed struct {
    AppName  string            `yaml:"appName" json:"appName" toml:"appName"`
    Debug    bool              `yaml:"debug" json:"debug" toml:"debug"`
    // highlight-start
    SailConf sailConfig.Config `yaml:"sailConf" json:"sailConf" toml:"sailConf"` //tag is necessary
    // highlight-end
    ...
}
```  
### 匿名组合  
:::warning  
需要注意的是，在Go语言中允许匿名组合结构体从而实现字段提升，一般来讲常规的json包、yaml包和toml包不支持匿名组合方式的反序列化，因此匿名组合方法不能直接使用解析库将结构体解析配置到结构体中。
:::  
```go title="main.go" showLineNumbers  
import (
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"
)

type GlobalConfigAnonymous struct {
    AppName  string            `yaml:"appName" json:"appName" toml:"appName"`
    Debug    bool              `yaml:"debug" json:"debug" toml:"debug"`
    // highlight-start
    sailConfig.Config
    // highlight-end
    ...
}
```  
例如这样的解析操作将不会生效：  
```go title="main.go" showLineNumbers  
import (
    "fmt"
    "encoding/json"
)

func main() {
    var conf GlobalConfigAnonymous
    err := json.Unmarshal(sourceBytes, &conf)

    //this code will output empty
    fmt.Println(conf.HttpServer.Addr)
}
```  
:::tip  
如果你想要使用匿名组合的方式又想配置被正常解析，那么需要给匿名字段添加tag标签。  
:::  
```go title="main.go" showLineNumbers  
import (
    sailConfig "github.com/keepchen/go-sail/v3/sail/config"
)

type GlobalConfigAnonymous struct {
    AppName  string            `yaml:"appName" json:"appName" toml:"appName"`
    Debug    bool              `yaml:"debug" json:"debug" toml:"debug"`
    // highlight-start
    sailConfig.Config          `yaml:",inline" json:",inline" toml:",inline"`
    // highlight-end
    ...
}
```  
这样就可以正常解析了：  
```go title="main.go" showLineNumbers  
import (
    "fmt"
    "encoding/json"
    "gopkg.in/yaml.v3"
    "github.com/pelletier/go-toml/v2"
)

func main() {
    var conf GlobalConfigAnonymous
    //json
    err := json.Unmarshal(sourceBytes, &conf)
    //yaml
    err := yaml.Unmarshal(soruceBytes, &conf)
    //toml
    err := toml.Unmarshal(sourceBytes, &conf)

    fmt.Println(conf.HttpServer.Addr)
}
```  
:::tip  
有的第三方库支持默认展开匿名字段，例如`BurntSushi/toml`，但这并不是普遍行为，为了保持统一，建议在使用匿名组合的情况下都把tag标签加上。  
:::  

### 提议  
:::tip  
为避免字段歧义或冲突，我们建议开发者使用具名组合的方式来组织配置结构。  
:::