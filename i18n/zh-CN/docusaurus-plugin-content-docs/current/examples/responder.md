---
sidebar_position: 13
---  
# 响应器    
本节将介绍如何使用响应器。  
## 简介  
响应器的作用是统一响应数据结构，并高效地处理如 HTTP 状态码、错误码、错误信息等数据。  
## API 选项   
在前文中提到，响应器会处理 HTTP 状态码、错误码和错误信息，其处理策略由配置项决定。这些配置项对开发者开放，使其能够更灵活地满足不同的使用需求。  
这些配置内容被称为 **API 选项**，开发者可以通过如下方式进行设置：  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/constants"
    // highlight-start
    "github.com/keepchen/go-sail/v3/http/api"
    // highlight-end
    "github.com/keepchen/go-sail/v3/sail/config"
)

const ErrNone = sailConstants.CodeType(200)   

var (
    conf = &config.Config{}
    option = &api.Option{
        Timezone:         constants.DefaultTimeZone,
        ErrNoneCode:      ErrNone,
        ErrNoneCodeMsg:   "SUCCESS",
        ForceHttpCode200: true,
    }
)

func main() {
    sail.
        WakeupHttp("go-sail", conf).
        // highlight-start
        SetupApiOption(option).
        // highlight-end
        Hook(registerRoutes, nil, nil).
        Launch()
}
```  
目前，API 选项支持以下配置项：  
| 项目 | 说明 | 默认值 |
| --- | --- | --- |
| Timezone | 时间信息的时区 | `"Aisa/Shanghai"` |
| ErrNoneCode | 无错误时的错误码 | `0` |
| ErrNoneCodeMsg | 无错误时的错误信息 | `"SUCCESS"` |
| ErrRequestParamsInvalidCode | 请求参数错误的错误码 | `100000` | 
| ErrRequestParamsInvalidCodeMsg | 请求参数错误的错误信息 | `"Bad request parameters"` |
| ErrAuthorizationTokenInvalidCode | 授权信息无效的错误码 | `100001` |
| ErrAuthorizationTokenInvalidCodeMsg | 授权信息无效的错误信息 | `"Authorization token invalid"` | 
| ErrInternalServerErrorCode | 服务器内部错误的错误码 | `999999` |
| ErrInternalServerErrorCodeMsg | 服务器内部错误的错误信息 | `"Internal server error"` | 
| ForceHttpCode200 | 是否强制返回 200 HTTP 状态码 | `false` |
| DetectAcceptLanguage | 是否检测客户端语言 | `false` |    
| LanguageCode | 语言代码 | `"en"` |
| FuncBeforeWrite | 响应写入前的处理函数 | `nil` |  
| EmptyDataStruct | 空 `data` 字段的数据表现形式 | `nil` |  

### Timezone  
Timezone 选项决定响应器处理时间时所使用的时区。目前时间信息仅使用时间戳，因此该配置项将在后续更新中发挥更大作用。  

### ErrNone 和 ErrNoneCodeMsg  
No Error 表示无错误时（即处理成功）的代码值和代码信息。默认情况下，代码值为 `0`，代码信息为 `SUCCESS`。  
如果响应指定的无错误码等于该值，且 `ForceHttpCode200` 选项未设置为 `true`，则 HTTP 状态码会被设置为非 200。  

### ErrRequestParamsInvalidCode 和 ErrRequestParamsInvalidCodeMsg  
请求参数无效时的错误码和错误信息。当 `ForceHttpCode200` 未设置为 `true` 时，HTTP 状态码会被设置为 `400`。  

### ErrAuthorizationTokenInvalidCode 和 ErrAuthorizationTokenInvalidCodeMsg  
授权信息无效时的错误码和错误信息。当 `ForceHttpCode200` 未设置为 `true` 时，HTTP 状态码会被设置为 `401`。  

### ErrInternalServerErrorCode 和 ErrInternalServerErrorCodeMsg  
服务器内部错误时的错误码和错误信息。当 `ForceHttpCode200` 未设置为 `true` 时，HTTP 状态码会被设置为 `500`。  

### ForceHttpCode200  
当该值设置为 `true` 时，HTTP 状态码将不再根据错误码判断，而是直接返回 `200`。  

:::tip  
该选项适用于需要严格 HTTP 状态码响应，或仅通过错误码判断的场景。  
它代表了不同的接口返回设计思想。
:::  

### DetectAcceptLanguage  
指定响应器是否检测客户端语言，并从注入的语言代码表中提取指定客户端语言的内容。  

:::tip  
该选项需要中间件 `DetectUserAgentLanguage` 的配合。源码可在 `http/middleware/detectuseragentlanguage.go` 找到。
:::

### LanguageCode  
LanguageCode 选项指定响应器返回错误信息时所用的语言。当 `DetectAcceptLanguage` 未生效时作为兜底。  

### FuncBeforeWrite  
设置响应写入前的处理函数，允许开发者拦截并处理响应内容。需要注意的是，这里的响应内容是实际响应的副本，无法修改真正的响应内容，但可以用于日志等操作。  

### EmptyDataStruct  
通常情况下，`data` 字段为空时会被序列化为 `null`。部分客户端可能不期望这种行为，此时可通过该选项指定特定的空数据结构，如空数组（[]）、空对象（{}）、数字、布尔值等。  

## 错误码  
在实际业务开发中，通常会定义大量的错误码和错误信息。为了让响应器能够正确识别这些错误码和错误信息，需要提前进行注册。  

### 注册  
你可以通过如下方式进行注册，这是一种较为常见且简单的方式。  

```go title="main.go" showLineNumbers  
type ErrorCode int

func (v ErrorCode) Int() int {
    return int(v)
}

const (
    ErrUserNotExist                ErrorCode = 1000
    ErrUserAlreadyExist            ErrorCode = 1001
    ErrUsernameAndPasswordNotMatch ErrorCode = 1002
)

var codeMsgMap = map[ErrorCode]string{
    ErrUserNotExist:                "User not exist",
    ErrUserAlreadyExist:            "User already exist",
    ErrUsernameAndPasswordNotMatch: "Username and password not match",
}


var once sync.Once

func init() {
    once.Do(func() {
        time.AfterFunc(time.Second*2, func() {
            for code, msg := range codeMsgMap {
                sail.Code().Register("en", code.Int(), msg)
            }
        })
    })
}
```  

### 使用方式  
之后，你可以这样使用：  

```go title="main.go" showLineNumbers  
sail.Response(c).Bundle(ErrUserNotExist.Int(), nil).Send()
```  

:::tip  
同样，你也可以通过这种方式注册其他语言的错误码和错误信息。
:::  

## 响应包装器  
响应器目前提供了三种不同的包装器，以适应不同的场景。

我们假设有如下数据结构定义：  
```go title="main.go" showLineNumbers  
import "github.com/keepchen/go-sail/http/pojo/dto"

type UserInfo struct {
    dto.Base
    Data struct {
        Nickname string `json:"nickname" validate:"required" format:"string"`
        Age      number `json:"nickname" validate:"required" format:"number"`
    } `json:"data" validate:"required" format:"object"`
}

func (v UserInfo) GetData() interface{} {
    return v.Data
}

type SimpleUser struct {
    Nickname string `json:"nickname" validate:"required" format:"string"`
    Age      number `json:"nickname" validate:"required" format:"number"`
}
```  

### Builder  
`Builder` 包装器的错误码参数类型需要是 Go-Sail 的 `constants.ICodeType`，响应数据类型需要是 `dto.IResponse`。
```go title="main.go" showLineNumbers  
var userInfo UserInfo
sail.Response(c).Builder(constants.XX, resp).Send()
```  

### Wrap  
`Wrap` 包装器的错误码参数类型需要是 Go-Sail 的 `constants.ICodeType`，响应数据类型需要是 `interface`。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(constants.XX, resp).Send()
```  

### Bundle  
`Bundle` 包装器的错误码参数类型需要是 `int`，响应数据类型需要是 `interface`。在易用性方面，`Bundle` 是最简单的。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

这三种包装器分别代表了不同的响应数据结构和错误码调用方式。  
`UserInfo` 数据结构是完整的数据定义，而 `SimpleUser` 是精简的数据定义。在生成 Swagger 文档时，它们的表现会有所不同，具体取决于开发者的选择。

## 发送响应  
目前提供了多种语法糖用于发送响应。  

### Send  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

### Data  
该函数返回成功数据。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Data(resp)
```  

### Success  
该函数返回空的成功数据，等价于 `Data(nil)`。
```go title="main.go" showLineNumbers  
sail.Response(c).Success()
```  

### SendWithCode  
该函数可以强制返回指定的 HTTP 状态码，在某些特殊场景下非常有用。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap([someErrorCode], resp).SendWithCode(500)
```  

### Failure  
该函数在错误码为 Go-Sail 内置的 `constants.ErrRequestParamsInvalid` 时返回错误信息，HTTP 状态码由 API 配置项决定。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure()
```  

### Failure200  
该函数在发生错误时返回错误信息，错误码由调用方传入，HTTP 状态码为 `200`。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure200([code], nil)
```  

### Failure400  
该函数在发生错误时返回错误信息，错误码由调用方传入，HTTP 状态码为 `400`。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure400([code], nil)
```  

### Failure500  
该函数在发生错误时返回错误信息，错误码由调用方传入，HTTP 状态码为 `500`。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure500([code], nil)
```  
