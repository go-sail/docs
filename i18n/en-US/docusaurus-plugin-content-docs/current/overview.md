---
sidebar_position: 1
---

# Getting Started

Go-Sail is a lightweight progressive web framework written in Go. It's extremely simple to get started - you only need a few lines of code to get up and running. Let's begin.

## Getting Started

### Installation

> Requirements: [Go](https://go.dev/dl/) version **1.20** or above.  

```bash  showLineNumbers  
go get -u github.com/keepchen/go-sail/v3
```

### Launch Your Service
- Copy the following code into `main.go`
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
- Run command `go run main.go`  
- Open your browser and visit: [localhost:8080/hello](http://localhost:8080/hello)  
- Screenshot:  
![screenshot](/img/launch.png)  
- Your service is ready to go. Have fun! :)
