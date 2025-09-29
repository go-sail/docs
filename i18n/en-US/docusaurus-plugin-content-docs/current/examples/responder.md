---
sidebar_position: 13
---  
# Responder    
This section will introduce how to use the responder.  
## Introduction  
The role of the responder is to unify the response data structure and process data such as HTTP status codes, error codes, and error messages in a streamlined manner.  
## API Option   
The previous article mentioned that the responder will handle HTTP status codes, error codes, and error messages, and the handling strategy is determined by configuration items. These configuration items are exposed to developers, allowing them to more flexibly meet their usage needs.  
These configuration contents are called **API Options**, and developers can set them in the following ways:  

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
Currently, the API options support the following configuration entries:  
| Item | Description | Default value |
| --- | --- | --- |
| Timezone | Time zone of time information | `"Aisa/Shanghai"` |
| ErrNoneCode | Error Code - No-Error | `0` |
| ErrNoneCodeMsg | Error code message - No-Error | `"SUCCESS"` |
| ErrRequestParamsInvalidCode | Error code - request parameter error | `100000` | 
| ErrRequestParamsInvalidCodeMsg | Error code message - request parameter error | `"Bad request parameters"` |
| ErrAuthorizationTokenInvalidCode | Error Code - Invalid Authorization | `100001` |
| ErrAuthorizationTokenInvalidCodeMsg | Error Code Message - Invalid Authorization | `"Authorization token invalid"` | 
| ErrInternalServerErrorCode | Error code - Server internal error | `999999` |
| ErrInternalServerErrorCodeMsg | Error code message - Server internal error | `"Internal server error"` | 
| ForceHttpCode200 | Whether to force return of 200 HTTP status code | `false` |
| DetectAcceptLanguage | Whether to detect client language | `false` |    
| LanguageCode | Language Code | `"en"` |
| FuncBeforeWrite | Processing function before writing response | `nil` |  
| EmptyDataStruct | Empty `data` field data representation | `nil` |  

### Timezone  
The time zone option determines the time zone in which the responder processes time. Currently, only timestamps are used for time information, so this configuration item will have a substantial effect in subsequent updates.  

### ErrNone and ErrNoneCodeMsg  
No Error represents the code value and code message when no error occurs, that is, the transaction is successful. By default, the code value is `0` and the code message is `SUCCESS`.  
If the response specifies no error code equal to this value, and the `ForceHttpCode200` option is not set to `true`, then the HTTP status code will be set to something other than 200.  

### ErrRequestParamsInvalidCode and ErrRequestParamsInvalidCodeMsg  
Invalid request parameter error code and error message indicate that the client request parameters are invalid. When `ForceHttpCode200` is not set to `true`, the HTTP status code will be set to `400`.  

### ErrAuthorizationTokenInvalidCode and ErrAuthorizationTokenInvalidCodeMsg  
Invalid authorization information errors and error messages indicate that the authorization information held by the client is invalid. When `ForceHttpCode200` is not set to `true`, the HTTP status code will be set to `401`.  

### ErrInternalServerErrorCode and ErrInternalServerErrorCodeMsg  
Internal server error and error message indicate that an internal server error has occurred. When `ForceHttpCode200` is not set to `true`, the HTTP status code will be set to `500`.  

### ForceHttpCode200  
When this value is set to `true`, the HTTP status code will no longer be determined based on the error code, and will be directly set to `200`.  

:::tip  
This option is useful in situations where strict HTTP status code responses are required and in situations where only error codes are compared.
It represents a different interface return design philosophy.
:::  

### DetectAcceptLanguage  
Specifies whether the responder should detect the client language and extract the language from the injected language code table in the specified client language.  

:::tip  
This option requires the cooperation of the middleware `DetectUserAgentLanguage`. You can find the source code at `http/middleware/detectuseragentlanguage.go`.
:::

### LanguageCode  
The language code option specifies the language in which the responder responds to error messages.  It is a fallback when `DetectAcceptLanguage` does not complete.  

### FuncBeforeWrite  
Writing a pre-response processing function allows developers to intercept and process the response content. It is worth noting that the response content is a copy of the real response, so you cannot change the actual response content of the responder, but you can do things like logging.  

### EmptyDataStruct  
Normally, when the `data` field is empty, it will be serialized as `null`. In some cases, the client may not expect such behavior. In this case, you can use this option to specify a specific empty data structure, such as an empty array (square brackets), an empty object (curly braces), a number, or even a Boolean value.  

## Error codes  
In actual business development, many error codes and error messages are defined. In order for the responder to correctly identify these error codes and error messages, they need to be registered in advance.  

### Registration  
You can register in the following way, which is relatively common and simple.  

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

### Usage  
After this, you can use it like this:  

```go title="main.go" showLineNumbers  
sail.Response(c).Bundle(ErrUserNotExist.Int(), nil).Send()
```  

:::tip  
Similarly, you can register error codes and error messages in any other language in this way.
:::  

## Wrapper  
The responder currently provides three different wrappers to suit different scenarios.  

We assume the following data structure definition:  
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
The error code parameter type of the `Builder` wrapper needs to be Go-Sail's `constants.ICodeType`, and the response data type needs to be `dto.IResponse`.  
```go title="main.go" showLineNumbers  
var userInfo UserInfo
sail.Response(c).Builder(constants.XX, resp).Send()
```  

### Wrap  
The error code parameter type of the `Wrap` wrapper needs to be Go-Sail's `constants.ICodeType`, and the response data type needs to be `interface`.  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(constants.XX, resp).Send()
```  

### Bundle  
The error code parameter type of the `Bundle` wrapper needs to be `int`, and the response data type needs to be `interface`.  In terms of ease of use, `Bundle` is the easiest.  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

These three wrappers appear to represent different response data structures and error code calls.   
The `UserInfo` data structure is a complete data definition, and `SimpleUser` is a key data definition. They behave differently when generating Swagger documents, depending on how the developer chooses.  

## Send Response  
There are currently several syntax sugars available for sending responses.  

### Send  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

### Data  
This function returns success data.  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Data(resp)
```  

### Success  
This function returns empty success data, which is equivalent to `Data(nil)`.  
```go title="main.go" showLineNumbers  
sail.Response(c).Success()
```  

### SendWithCode  
This function can force the HTTP status code to be returned, which is very useful in some special cases.  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap([someErrorCode], resp).SendWithCode(500)
```  

### Failure  
This function returns an error message if the error code is `constants.ErrRequestParamsInvalid` built into Go-Sail, and the HTTP status code is determined by the API options.  
```go title="main.go" showLineNumbers  
sail.Response(c).Failure()
```  

### Failure200  
This function returns the error message if the error occurs. The error code is passed in by the caller. The HTTP status code is `200`.  
```go title="main.go" showLineNumbers  
sail.Response(c).Failure200([code], nil)
```  

### Failure400  
This function returns the error message if the error occurs. The error code is passed in by the caller. The HTTP status code is `400`.  
```go title="main.go" showLineNumbers  
sail.Response(c).Failure400([code], nil)
```  

### Failure500  
This function returns the error message if the error occurs. The error code is passed in by the caller. The HTTP status code is `500`.   
```go title="main.go" showLineNumbers  
sail.Response(c).Failure500([code], nil)
```  
