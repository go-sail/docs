---
sidebar_position: 3
---  
# Middleware  
This chapter will introduce how to register route middleware in Go-Sail.  

## Introduction  
Routing middleware sits between pre-processing requests and post-processing, acting as a bridge between the two. Typically, we place common processing measures, such as identity verification, in middleware.  
Go-Sail uses Gin as its HTTP service engine without any excessive wrapping, so its usage is exactly the same as Gin's own usage.  

In the previous chapter, after a user successfully logs in, we will issue a pass token to the user. In subsequent requests, the user can use this token to make a request to access some resources that require identity verification.  

## Declaring a route middleware  
First, let's write a middleware function according to Gin's specifications. The code is as follows.  
:::tip  
We assume the user places their access credentials in the request header, and the field name is "Authorization".
:::  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
)

...

// ValidateToken validate user's token
func ValidateToken() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.Request.Header.Get("Authorization")
        if token != "this-is-a-valid-token" {
            sail.Response(c).Wrap(constants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }

        c.Next()
    }
}

...
```  

## Use route middleware in routes  
After that, we can wrap the routes that require authentication and use the same authentication logic uniformly.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
)
var (
    ...

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
            
            token := "this-is-a-valid-token"
            sail.Response(c).Data(token)
        })
        // highlight-start
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
            userGroup.GET("/balance", ...).
                      GET("/info", ...).
                      GET("/logout", ...)
        }
        // highlight-end
    }
    ...
)
```  
The highlighted code indicates that authentication is required to access the `/user/balance`, `/user/info`, and `/user/logout` routes.