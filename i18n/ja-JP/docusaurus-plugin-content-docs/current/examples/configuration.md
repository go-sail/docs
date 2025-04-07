---
sidebar_position: 1
---  
# 設定  
本章では設定項目の使用方法について説明します。  

## はじめに  
設定は、Go-Sailサービス全体を起動するための重要な要素の1つです。これはGo-Sailの動作方法を決定します。  

前章で説明したGo-Sailを最速で起動する方法は、以下のコードです：  
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
上記のコードは以下のことを行います：  
- 1.最小限の設定でGo-Sailサービスを起動します  
- 2.すべての設定項目はフレームワークのデフォルト設定を使用しています  
- 3.パス名が`/hello`のルートハンドラ関数を登録しました  

Go-Sailの設定は大きく2つのカテゴリーに分けることができます。1つはHTTPサービスの設定項目で、もう1つはコンポーネントライブラリの設定項目です。以下でそれぞれの使用方法について説明します。  

## HTTPサービス  
HTTPサービスの設定項目には、DEBUGモードの有効化、サービスのリッスンアドレス、Swaggerドキュメント、PrometheusおよびWebsocketが含まれます。  
では、これらの設定項目の具体的な内容をより明確に指定することができます。  

### リッスンとデバッグ  
#### HTTPサービス  
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
DEBUGの設定項目が影響を与える範囲について説明します：  
- trueの場合、ginはdebugModeで起動し、falseの場合はreleaseModeで起動し、カラー端末出力は使用されません。  
- trueの場合、Pprofモニタリングが有効になり、falseの場合は無効になります。  
- trueの場合、パス名が`/go-sail`の追加ルートハンドラ関数が登録され、falseの場合は登録されません。  

:::warning  
本番環境では`Debug`の値を`false`に設定することを**強く推奨**します！  
:::  
#### Websocketサービス  
Websocketサービスはオプションであり、必要に応じて有効にすることができます。以下の設定で、クライアントがWebsocketサービスに接続するためのルートパスを指定します。  
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
同時に、フレームワークを起動する際に、以下のようにWebsocketサービスの起動を指定する必要があります。  
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
これで、デフォルトのWebsocketサービスが正常に起動されました。  
:::tip  
デフォルトのWebsocketサービスは、クライアントから送信されたメッセージを表示するだけで、他の操作は行いません。そのため、カスタムの接続ロジックと処理関数を使用するには、`EnableWebsocket`メソッドのパラメータを指定する必要があります。  
:::

### Swagger  
Swaggerの有効化は`config.SwaggerConf`設定で管理されています。この設計により、開発者はより細かい粒度での制御が可能になります。個別に有効/無効を選択できます。  
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
`RedocUIPath`はRedoclyドキュメントツールで生成されたHTMLファイルのパスを指定します。正しく設定すると、Go-SailはRedoclyドキュメントUIのルーティングを管理し、起動後にターミナル出力から直接アクセスできるようになります。  
:::tip  
Redoclyは優れたサードパーティのドキュメントUI生成ツールで、OpenAPI仕様に準拠したYAMLファイルをコマンドラインで素早くHTMLファイルに直接変換することができます。  

> 仮に  
> YAMLファイルのパスが**pkg/app/ucenter/docs/*.yaml**で、生成されるHTMLファイルのパスが**pkg/app/ucenter/docs/apidoc.html**の場合  

以下のコマンドを実行すると、Redocly UIスタイルのHTMLファイルが生成されます。  
```shell  
redocly build-docs pkg/app/ucenter/docs/*.yaml -o pkg/app/ucenter/docs/apidoc.html  
```  

この場合、`RedocUIPath`を**pkg/app/ucenter/docs/apidoc.html**に設定するだけです。  
:::  

#### JsonPath  
`JsonPath`はSwagger UIが必要とするJSONファイルのパスです。  
上記の例では、`JsonPath`を**pkg/app/ucenter/docs/swagger.json**に設定するだけです。  

#### FaviconPath  
`FaviconPath`はブラウザのタブアイコンのパスを提供します。ドキュメントを公開し、ブランドイメージを重視する必要がある場合に、この設定が役立ちます。もちろん、設定しなくても問題ありません。その場合、Go-Sailはフレームワーク自体のロゴをアイコンとして表示します。  

### Prometheus  
Prometheusの有効化は`config.PrometheusConf`設定で制御されます。この設計により、開発者はより細かい粒度での制御が可能になります。個別に有効/無効を選択できます。  
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
上記の設定項目は、Prometheusメトリクス収集を有効にし、ポート`8001`でリッスンし、アクセスパスを`/metrics`に設定し、システムメトリクスのサンプリングを実行し、`/data`ディレクトリ下のデータのディスク使用率サンプリングを収集し、システムサンプリング間隔を`30秒`に設定することを指定しています。  
:::tip  
注意：Prometheusは独立したHTTPサービスとして起動するため、ビジネスサービスとは異なるポートを設定する必要があります。これにより、より良いアクセス制御が可能になります。例えば、ビジネスサービスは外部に公開しながら、メトリクス収集は内部サービスのみにアクセスを制限するといった運用が可能です。  
:::  

## コンポーネントライブラリ  
各コンポーネントライブラリには、それぞれ独立した`Enable`設定項目があり、そのコンポーネントを有効にするかどうかを制御します。`true`に設定すると、Go-Sailは起動時に設定に従って初期化を試みます。  
:::tip  
前述のように、一般的にコンポーネントライブラリはシングルトンパターンでアクセスを提供するため、特に明記されていない限り、コンポーネントの設定はホットリロードをサポートしていません。  
:::  
:::warning  
注意：コンポーネントを有効にしても、そのコンポーネントの初期化に失敗した場合（データベース接続の失敗など）、サービスは終了して停止します。  
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
特記事項：Loggerのエクスポーターは現在、Redis（スタンドアロンおよびクラスターモード）、Nats、Kafkaをサポートしています。  
エクスポーターを有効にした場合、それらの接続インスタンスは`sail.GetXX`で取得されるインスタンスとは独立しており、相互に関連性はありません。  
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
#### スタンドアロンインスタンス  
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
#### クラスター構成  
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

## パース  
実際の使用シーンでは、設定項目はハードコードで個別に設定されることはなく、一般的にはNacos、Etcd、さらにはファイルなどの他の手段を通じて読み取られ、解析されます。configパッケージでは、Go-Sailは開発者にシンプルな解析メソッドを提供しており、開発者は選択的に使用することができます。現在、Go-Sailは`yaml`、`toml`、`json`の3つの一般的なフォーマットをサポートしています。  
### デフォルトテンプレート  
プロジェクトが新規の場合、設定ファイルはまだ存在しません。Go-Sailは開発者向けにデフォルト設定を出力してファイルに保存する機能を提供しており、これにより設定ファイルのテンプレートを素早く取得することができます。  
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
### ソース文字列からの解析  
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
### Etcdからの解析  
[Etcd](https://etcd.io/)を使用する場合、Go-Sailが提供する便利なメソッドを使用して、Etcd設定センターから設定情報を読み取りおよび監視することができます。  

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
### Nacosからの解析  
[Nacos](https://nacos.io)を使用する場合、Go-Sailが提供する便利なメソッドを使用して、Nacos設定センターから設定情報を読み取りおよび監視することができます。  

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
## ネストされた構成  
Go-Sailの設定ファイルはフレームワーク自体に必要な設定項目のみを含みます。実際のプロジェクトでは、他のビジネス関連の設定項目が伴うことがよくあります。そのため、実際のニーズを満たすために設定項目を組み合わせたりネストしたりする必要があります。  
例えば：  
### 名前付き構成  
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
### 匿名構造体の埋め込み  
:::warning  
注意すべき点として、Go言語では匿名構造体の埋め込みによるフィールドの昇格が可能ですが、一般的な json パッケージ、yaml パッケージ、toml パッケージは匿名構造体の埋め込みによるデシリアライズをサポートしていないため、匿名構造体の埋め込みを使用する場合、パーサーライブラリを直接使用して構造体に設定を解析することはできません。  
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
例えば、このような解析操作は機能しません：  
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
匿名構造体の埋め込みを使用しながら設定を正常に解析したい場合は、匿名フィールドにタグを追加する必要があります。  
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
このように正常に解析できるようになります：  
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
`BurntSushi/toml`のような一部のサードパーティライブラリは、デフォルトで匿名フィールドを展開することをサポートしていますが、これは一般的な動作ではありません。一貫性を保つために、匿名構造体の埋め込みを使用する場合は、常にタグを追加することをお勧めします。  
:::  

### 提案  
:::tip  
フィールドの曖昧さや競合を避けるため、開発者には名前付き合成を使用して設定構造を整理することをお勧めします。  
:::