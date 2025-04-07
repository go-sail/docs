---
sidebar_position: 2
---

# ライフサイクル  
この章では、Go-Sail の動作原理とライフサイクルについて説明します。  

## どのように機能しますか?  
Go-Sail の開始と停止は特定の順序で行われ、異なる段階で特定のタスクが実行されます。  

## Go-Sailのライフサイクル  

### 初期設定  
まず、Go-Sail は、後で使用するために必要な構成をプログラム スタックに挿入します。  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail/config"
)

var conf = &config.Config{}
```  
`config.Config{}` 構成には、Go-Sail に必要な完全な構成項目が含まれています。ニーズに応じてコンテンツを設定できます。  
例として、http サービスの構成を見てみましょう。サービスがリッスンするポート、サービスをデバッグ モードで実行するかどうか、Swagger ドキュメントを有効にするかどうかなどを設定できます。  
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

### スタートアップ項目の設定  
次に、Go-Sail の特定の機能の動作を決定する、必要な起動項目を設定する必要があります。  
#### API オプション (オプション)  
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

#### Websocketを有効にする（オプション）  
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

#### フック関数を設定する（オプション）  
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
### 起動する  
`Launch()` 関数が呼び出されると、Go-Sail は起動コマンドを実行し、サービスを開始します。  
Go-Sail は次の手順をこの順序で実行します：  
- **`beforeFunc` 関数を実行する (オプション)**  
この機能では特定のアクションを実行できます。この関数は、サービスが開始される前に呼び出されます。  
    :::warning    
    この段階では、コンポーネントはまだ初期化されていないため、この関数でコンポーネント インスタンスを呼び出すことはできません。呼び出すと、panicが発生します。
    :::
- **スタートアップコンポーネント**  
この段階で、Go-Sail はユーザーが指定した構成ファイルの内容に従って、対応するコンポーネントまたはサービスを起動します。たとえば、ログ ライブラリの初期化、データベース接続の初期化、Redis 接続の初期化などです。  

- **ルーティングエンジン（gin）を初期化する**  
この段階で、Go-Sail はジンエンジンを初期化し、後続のルート登録の準備をします。  

- **Websocket サービスの登録**  
この段階で、Go-Sail は Websocket 接続を開始し、ルーティング エンジンに登録します。もちろん、この段階は必須ではありません。  

- **启动pprof**  
構成ファイルで指定された場合にのみ有効になります。  

- **Prometheusインジケーターの収集を開始する**  
構成ファイルで指定された場合にのみ有効になります。  

- **Swaggerドキュメントサービスを開始する**    
構成ファイルで指定された場合にのみ有効になります。  

- **ルーティングサービスを開始し、httpリクエストをリッスンします**  

- **要約情報を端末に印刷する**  
  
![screenshot](/img/launch.png)
おそらく次のようになります:
- **`afterFunc` 関数を実行する (オプション)**  
    :::tip  
    この段階では、関連するコンポーネントが初期化されています。この関数では、データベース テーブル構造、テーブル データ、スケジュールされたタスクなどの初期化など、必要な機能を実行できます。  
    :::

- **システム信号を監視する**  
このフェーズでは、Go-Sail はシステム信号を監視し続け、終了信号を受信するまで終了操作を実行しません。  

- **コンポーネントを閉じる**  
Go-Sail は終了信号を受信すると、以前に起動したコンポーネントまたはサービスを 1 つずつシャットダウンします。  

- **プロセス全体が終了する**  

## リクエストライフサイクル  
リクエスト ライフサイクルは、サービス ノードへの到着から中間処理、そして最終的な応答の返送までの HTTP リクエストのプロセス全体を表します。全体のプロセスと発生したイベントについて説明します。  

### ルーティングミドルウェア  
リクエストがサービス ノードに到着すると、まず一連のルーティング ミドルウェアを通過し、これらのミドルウェアでリクエストのコンテキストが処理されます。  

#### リンクログ追跡  
まず、リクエストがサービス ノードに到着すると、gin エンジンによって監視され、キャプチャされます。 Go-Sail は、リクエストを `LogTrace` と呼ばれるルーティング ミドルウェアに渡します。このミドルウェアでは、いくつかの必要なリンク ログ追跡情報が挿入されます。後続のアクセス要求のコンテキストを入力します。  
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
#### Prometheus輸出業者  
Prometheus エクスポータ ミドルウェアは、リクエスト応答に関するいくつかの数値インジケーターをリクエスト コンテキストに挿入します。このミドルウェアは Prometheus サービスと組み合わせて使用​​されます。  
:::tip  
このミドルウェアはオプションであり、必要に応じて構成ファイルを指定することで有効化または無効化できます。
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
ミドルウェアは、CPU 使用率、メモリ使用量、ネットワーク転送、ディスク負荷などのシステム メトリックのサンプリングをサポートします。必要に応じて構成ファイルを指定して、これを有効または無効にすることができます。
:::  
#### その他のミドルウェア  
さらに、リクエストは Cors、Gzip など、開発者が指定した他のミドルウェアも通過します。もちろん、これらのミドルウェアもオプションであり、開発者によって完全に指定されます。  

### 処理機能  
リクエストが一連のルーティング ミドルウェアを通過した後、ルーティング処理機能に到達します。これは通常、特定のビジネス処理コードです。  
> 具体的な処理ロジックと手順は開発者自身によって決定されます。  

一般的に、処理にはいくつかのステップがあります：  
#### パラメータバインディング  
リクエストパラメータを Go コードにバインドします。  
#### パラメータ検証  
リクエストパラメータが条件を満たしていることを確認します。  
#### ビジネス処理  
リクエストパラメータに基づいて条件を満たすレコードをデータベースに照会するなどのビジネス ロジックを処理します。  
#### 応答を返す  
ビジネスロジックを処理した後、処理結果がクライアント（リクエストを開始した側）に応答されます。  

### やっと  
この時点で、サービス ノードへのリクエストの到着から処理、そして最終的な応答までのプロセス全体が完了します。  

