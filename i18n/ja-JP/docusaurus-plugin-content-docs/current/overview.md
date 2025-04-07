---
sidebar_position: 1
---

# 始める  

Go-Sail は軽量でプログレッシブな Golang Web フレームワークです。始めるのは非常に簡単で、数行のコードだけが必要です。始めましょう。

## はじめる  

### インストール

> 必要とする： [Go](https://go.dev/dl/) バージョン **1.20** 以上。  

```bash  showLineNumbers  
go get -u github.com/keepchen/go-sail/v3
```

### サービスを開始する  
- 次のコードを`main.go`ファイルにコピーします  
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
- コマンドの実行`go run main.go`  
- ブラウザを開いて次のサイトにアクセスしてください: [localhost:8080/hello](http://localhost:8080/hello)  
- スクリーンショット:  
![screenshot](/img/launch.png)  
- サービスの準備が整いました。ぜひご利用ください。 :)
