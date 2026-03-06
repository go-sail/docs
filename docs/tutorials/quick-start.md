---
sidebar_position: 1
---  
# Quick Start
This chapter will introduce how to quick start your service by Go-Sail.  

## Introduction  
We first used the convenient commands provided by Go-Sail to quickly start a skeleton service. It is the foundation for everything that follows.

## Launch Skeleton Service  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            sail.Response(c).Data("hello world!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  

The code above starts an HTTP service, listening on the default port `8080`, and registers a route with the path `/hello`. Therefore, when the code runs, you can access it by entering `http://localhost:8080/hello` in your browser's address bar.  

Okay, so now we have a basic skeleton service, which doesn't yet implement any business logic. We'll add features to it step by step.  


