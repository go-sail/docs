---
sidebar_position: 2
---  
# Register route
This chapter will introduce how to register route in Go-Sail.  

## Introduction  
go-sail uses Gin as its HTTP service engine without any excessive wrapping, so its usage is exactly the same as Gin's own usage.

## Register a new route  
In the previous chapter, we started a skeleton service. It registered a route named `/hello`. Now, let's register a new route for our application, named `/login`, for user login.  
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
        // highlight-start
        ginEngine.POST("/login", func(c *gin.Context){
            sail.Response(c).Data("login successfully!")
        })
        // highlight-end
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
By looking at the highlighted code, it's easy to see that this route only accepts `POST` requests and responds with "login successful!" without doing anything else.  
Next, we will begin to enhance its capabilities.  

## Bind request parameters  
There are multiple ways to fill and read parameters for HTTP POST requests. To simplify the process, we use Gin's automatic type identification and parameter binding feature.  

First, we defined the structure of the request parameters, which will facilitate subsequent use and also improve the readability of the code.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

// highlight-start
type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}
// highlight-end

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            sail.Response(c).Data("hello world!")
        })
        ginEngine.POST("/login", func(c *gin.Context){
            sail.Response(c).Data("login successfully!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  

Next, we bind the request data to the defined structure in the `/login` route.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            sail.Response(c).Data("hello world!")
        })
        ginEngine.POST("/login", func(c *gin.Context){
            // highlight-start
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            // highlight-end

            sail.Response(c).Data("login successfully!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  

## Validate request parameters  
Typically, we need to validate request parameters. For example, here we need to verify whether the username and password are correct and match.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            sail.Response(c).Data("hello world!")
        })
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            // highlight-start
            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }
            // highlight-end

            sail.Response(c).Data("login successfully!")
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  

## Issuance of Certificates  
Once a user successfully logs in, we will issue them a credential, which serves as a pass to access service resources.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
)

type LoginRequest struct {
    Username string `json:"username" form:"username" query:"username"`
    Password string `json:"password" form:"password" query:"password"`
}

var (
    conf = &config.Config{}
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.GET("/hello", func(c *gin.Context){
            sail.Response(c).Data("hello world!")
        })
        ginEngine.POST("/login", func(c *gin.Context){
            var loginRequest LoginRequest
            c.ShouldBind(&loginRequest)
            
            if loginRequest.Username != "go-sail" || loginRequest.Password != "password" {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }
            // highlight-start
            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
            // highlight-end
        })
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, nil).Launch()
}
```  
After this, the user can use this credential to access service resources. We will allow the request after verifying the token's validity.  

:::tip  
You can find more detailed usage information in [Gin's official documentation](https://gin-gonic.com). 
:::  