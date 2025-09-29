---
sidebar_position: 13
---  
# レスポンダー    
このセクションでは、レスポンダーの使い方について説明します。  
## はじめに  
レスポンダーの役割は、レスポンスデータの構造を統一し、HTTPステータスコードやエラーコード、エラーメッセージなどのデータを一元的かつ効率的に処理することです。  
## APIオプション   
前回の記事で述べたように、レスポンダーはHTTPステータスコード、エラーコード、エラーメッセージの処理を担当し、その処理方針は設定項目によって決まります。これらの設定項目は開発者に公開されており、より柔軟に利用ニーズに対応できるようになっています。  
これらの設定内容は**APIオプション**と呼ばれ、開発者は以下のように設定できます。  

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
現在、APIオプションでサポートされている設定項目は以下の通りです:  
| 項目 | 説明 | デフォルト値 |
| --- | --- | --- |
| Timezone | 時刻情報のタイムゾーン | `"Aisa/Shanghai"` |
| ErrNoneCode | エラーなし時のエラーコード | `0` |
| ErrNoneCodeMsg | エラーなし時のエラーメッセージ | `"SUCCESS"` |
| ErrRequestParamsInvalidCode | リクエストパラメータエラー時のエラーコード | `100000` | 
| ErrRequestParamsInvalidCodeMsg | リクエストパラメータエラー時のエラーメッセージ | `"Bad request parameters"` |
| ErrAuthorizationTokenInvalidCode | 認証情報無効時のエラーコード | `100001` |
| ErrAuthorizationTokenInvalidCodeMsg | 認証情報無効時のエラーメッセージ | `"Authorization token invalid"` | 
| ErrInternalServerErrorCode | サーバー内部エラー時のエラーコード | `999999` |
| ErrInternalServerErrorCodeMsg | サーバー内部エラー時のエラーメッセージ | `"Internal server error"` | 
| ForceHttpCode200 | HTTPステータスコード200を強制的に返すか | `false` |
| DetectAcceptLanguage | クライアントの言語を検出するか | `false` |    
| LanguageCode | 言語コード | `"en"` |
| FuncBeforeWrite | レスポンス書き込み前の処理関数 | `nil` |  
| EmptyDataStruct | 空の`data`フィールドのデータ表現 | `nil` |  

### Timezone  
Timezoneオプションは、レスポンダーが時刻を処理する際のタイムゾーンを決定します。現在は時刻情報としてタイムスタンプのみが使用されていますが、この設定項目は今後のアップデートで大きな効果を持つようになります。

### ErrNone および ErrNoneCodeMsg  
No Errorは、エラーが発生していない（すなわち処理が成功した）場合のコード値とコードメッセージを表します。デフォルトでは、コード値は`0`、コードメッセージは`SUCCESS`です。  
レスポンスでこの値と等しいエラーコードが指定され、かつ `ForceHttpCode200` オプションが `true` でない場合、HTTPステータスコードは200以外に設定されます。

### ErrRequestParamsInvalidCode および ErrRequestParamsInvalidCodeMsg  
リクエストパラメータが無効な場合のエラーコードとエラーメッセージです。`ForceHttpCode200` が `true` でない場合、HTTPステータスコードは`400`に設定されます。

### ErrAuthorizationTokenInvalidCode および ErrAuthorizationTokenInvalidCodeMsg  
認証情報が無効な場合のエラーコードとエラーメッセージです。`ForceHttpCode200` が `true` でない場合、HTTPステータスコードは`401`に設定されます。

### ErrInternalServerErrorCode および ErrInternalServerErrorCodeMsg  
サーバー内部エラーが発生した場合のエラーコードとエラーメッセージです。`ForceHttpCode200` が `true` でない場合、HTTPステータスコードは`500`に設定されます。

### ForceHttpCode200  
この値を `true` に設定すると、HTTPステータスコードはエラーコードに関係なく常に`200`になります。

:::tip  
このオプションは、厳密なHTTPステータスコードのレスポンスが求められる場合や、エラーコードのみで判定する設計方針の場合に有用です。  
異なるインターフェース設計思想を表します。
:::

### DetectAcceptLanguage  
レスポンダーがクライアントの言語を検出し、指定されたクライアント言語の言語コードテーブルから言語を抽出するかどうかを指定します。

:::tip  
このオプションは、ミドルウェア `DetectUserAgentLanguage` の協力が必要です。ソースコードは `http/middleware/detectuseragentlanguage.go` にあります。
:::

### LanguageCode  
LanguageCodeオプションは、レスポンダーがエラーメッセージを返す際の言語を指定します。`DetectAcceptLanguage` が機能しなかった場合のフォールバックとして使われます。

### FuncBeforeWrite  
レスポンス書き込み前の処理関数を設定することで、開発者はレスポンス内容をフックして処理できます。なお、ここで渡されるレスポンス内容は実際のレスポンスのコピーであり、実際のレスポンダーのレスポンス内容を変更することはできませんが、ログ出力などは可能です。

### EmptyDataStruct  
通常、`data` フィールドが空の場合は `null` としてシリアライズされますが、クライアントによってはこの挙動を期待しない場合があります。その場合、このオプションで空配列（`[]`）、空オブジェクト（`{}`）、数値、真偽値など、特定の空データ構造を指定できます。

## エラーコード  
実際の業務開発では、多くのエラーコードやエラーメッセージが定義されます。レスポンダーがこれらのエラーコードやエラーメッセージを正しく認識するためには、事前に登録しておく必要があります。

### 登録方法  
以下のように登録するのが一般的で簡単な方法です。

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

### 使用方法  
この後、以下のように使用できます：  

```go title="main.go" showLineNumbers  
sail.Response(c).Bundle(ErrUserNotExist.Int(), nil).Send()
```  

:::tip  
同様に、他の言語でもこの方法でエラーコードやエラーメッセージを登録できます。
:::  

## ラッパー  
レスポンダーは現在、さまざまなシナリオに対応する3種類のラッパーを提供しています。  

以下のデータ構造定義を前提とします：  
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
`Builder`ラッパーのエラーコードのパラメータ型はGo-Sailの`constants.ICodeType`である必要があり、レスポンスデータの型は`dto.IResponse`である必要があります。  
```go title="main.go" showLineNumbers  
var userInfo UserInfo
sail.Response(c).Builder(constants.XX, resp).Send()
```  

### Wrap  
`Wrap`ラッパーのエラーコードのパラメータ型はGo-Sailの`constants.ICodeType`であり、レスポンスデータの型は`interface`である必要があります。  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(constants.XX, resp).Send()
```  

### Bundle  
`Bundle`ラッパーのエラーコードのパラメータ型は`int`である必要があり、レスポンスデータの型は`interface`である必要があります。使いやすさの観点では、`Bundle`が最も簡単です。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

これら3種類のラッパーは、それぞれ異なるレスポンスデータ構造やエラーコードの呼び出し方法を表しています。  
`UserInfo`データ構造は完全なデータ定義であり、`SimpleUser`は主要なデータ定義です。Swaggerドキュメントを生成する際、開発者の選択によって挙動が異なります。

## レスポンスの送信  
現在、レスポンスを送信するためのシンタックスシュガーがいくつか用意されています。  

### Send  
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap(200, resp).Send()
```  

### Data  
この関数は成功時のデータを返します。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Data(resp)
```  

### Success  
この関数は空の成功データを返します。`Data(nil)`と同等です。
```go title="main.go" showLineNumbers  
sail.Response(c).Success()
```  

### SendWithCode  
この関数はHTTPステータスコードを強制的に返すことができ、特定のケースで非常に便利です。
```go title="main.go" showLineNumbers  
var userInfo SimpleUser
sail.Response(c).Wrap([someErrorCode], resp).SendWithCode(500)
```  

### Failure  
この関数は、Go-Sailに組み込まれているエラーコード `constants.ErrRequestParamsInvalid` の場合にエラーメッセージを返し、HTTPステータスコードはAPIオプションによって決定されます。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure()
```  

### Failure200  
この関数はエラーが発生した場合にエラーメッセージを返します。エラーコードは呼び出し元が指定します。HTTPステータスコードは`200`です。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure200([code], nil)
```  

### Failure400  
この関数はエラーが発生した場合にエラーメッセージを返します。エラーコードは呼び出し元が指定します。HTTPステータスコードは`400`です。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure400([code], nil)
```  

### Failure500  
この関数はエラーが発生した場合にエラーメッセージを返します。エラーコードは呼び出し元が指定します。HTTPステータスコードは`500`です。
```go title="main.go" showLineNumbers  
sail.Response(c).Failure500([code], nil)
```  
