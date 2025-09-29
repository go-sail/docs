---
sidebar_position: 14
---  
# ツールキット  
本章ではツールキットの使用方法について説明します。  
## はじめに  
Go-Sailは、一般的なツール機能を含むツールキットを提供しています。  
:::tip  
バージョンの更新に伴い、サポートされるツール関数も適宜更新されます。  
:::  
## AES  
### エンコード  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Aes().Encode(rawStr, key)
}
```  
### デコード  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    decoded, err := utils.Aes().Decode(encoded, key)
}
```  
## Base64  
### エンコード  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Base64().Encode(rawBytes)
}
```  
### デコード  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    decoded, err := utils.Base64().Decode(encoded)
}
```  
## CRC  
### Checksum 32
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Crc32().Checksum(rawBytes, table)
}
```  
### Checksum 64
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Crc64().Checksum(rawBytes, table)
}
```  
### Checksum ECMA
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Crc64().ChecksumECMA(rawBytes)
}
```  
### Checksum IEEE
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Crc32().ChecksumIEEE(rawBytes)
}
```  
## Datetime  
### 日付のフォーマット  
```go title="main.go" showLineNumbers  
import (
    "time"
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    now := time.Now()
    result := utils.Datetime().FormatDate(now, utils.YYYYMMDDHHMMSS)

    result := utils.Datetime().FormatDate(now, utils.YYYY_MM_DD_HH_MM_SS_SSS)
}
```  
### 日付の解析  
```go title="main.go" showLineNumbers  
import (
    "time"
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    loc, _ := time.LoadLocation(constants.DefaultTimeZone)
    date := "2024-05-01 10:00:00"
    timeObj, err := utils.Datetime().ParseDate(date, string(utils.YYYY_MM_DD_HH_MM_SS_SSS), loc)
}
```  
## ファイル  
### 保存先への保存  
> from gin.Context  

```go title="examples/pkg/app/user/http/handler/user.go" showLineNumbers  
import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/utils"
)

func UserInfo(c *gin.Context) {
    ...
    fileheader, _ := c.FormFile("filename")
    err := utils.File().Save2Dst(filehader, "path/to/filename")
    ...
}
```  
### コンテンツの取得  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.File().GetContents("path/to/filename")
}
```  
### コンテンツの書き込み  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().PutContents(content, "path/to/filename")
}
```  
### コンテンツの追加  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().AppendContents(content, "path/to/filename")
}
```  
### 存在の確認  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.File().Exists("path/to/filename")

    ok, err := utils.File().ExistsWithError("path/to/filename")
}
```  
### 拡張子の取得  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ext := utils.File().Ext("path/to/filename")
}
```  
### 行ごとの読み取り  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    readCh, err := utils.File().GetContentsReadLine("path/to/filename")
    for content := range readCh {
        fmt.Println(content)
    }
}
```  
## IP  
### ローカルIPの取得  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    localIp, err := utils.IP().GetLocal()
}
```  
## MD5  
### エンコード  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded := utils.MD5().Encode(rawStr)
}
```  
## Redisロック  
:::tip  
Redisロックは内部で自動的に更新されるため、開発者は内部の詳細を気にする必要はありません。  
:::  
:::warning  
単独で使用する場合は、最初に"redis.InitRedis"または"redis.InitRedisCluster"を使用して接続を初期化する必要があります。  
:::  
### ロックの取得を試みる  
> ノンブロッキング方式  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.RedisLocker().TryLock(key)
}
```  
### ロックの取得  
> ブロッキング方式  

```go title="main.go" showLineNumbers  
import (
    "context"
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ctx, cancel := context.WithDeadline(context.Background())
    go func(){
        for range ctx.Deadline() {
            cancel()
        }
    }()
    utils.RedisLocker().Lock(ctx, key)
}
```  
### ロック解除  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.RedisLocker().Unlock(key)
}
```  
## RSA  
### 暗号化  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Encrypt(rawString, publicKey)
}
```  
### 復号化  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Decrypt(rawString, publicKey)
}
```  
## シグナル  
### システムシグナルの監視  
> ブロッキング方式  

```go title="main.go" showLineNumbers  
import (
    "sync"
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ...
    wg := &sync.WaitGroup{}
    ...
    result, err := utils.Singal().ListeningExit(wg)
}
```  
## SM4  
### 暗号化  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBEncrypt(hexKey, rawStr)
}
```  
### 復号化  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBDecrypt(hexKey, rawStr)
}
```  
## 文字列
### 文字列の折り返し  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Wordwrap(rawStr, 64, "\n")
}
```  
### Redisキーのラッピング  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().WrapRedisKey(appName, key)
}
```  
### ランダムな文字列  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomLetters(length)
}
```  
### ランダムな数字列  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomDigitalChars(length)
}
```  
### ランダムな複合文字  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomComplexString(length)
}
```  
### 反転  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Reverse(rawStr)
}
```  
### シャッフル  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Shuffle(rawStr)
}
```  
### パディング（左側）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingLeft(rawStr, padChar, length)
}
```  
### パディング（右側）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingRight(rawStr, padChar, length)
}
```  
### パディング（両側）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingBoth(rawStr, padChar, length)
}
```  
## 数値  
### 範囲内のランダムな整数  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomInt64(start, end)
}
```  
### 範囲内のランダムな浮動小数点数  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomFloat64(start, end)
}
```  
### べき乗計算  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().Pow(x, y)
}
```  
## Swagger  
### 概要コメントの出力  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Swagger().PrintSummaryInfo(param)
}
```  
### コントローラー関数のコメントを出力  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Swagger().PrintControllerInfo(param)
}
```  
## Time  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/pkg/constants"
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.NewTimeWithTimeZone(constants.DefaultTimeZone).Now().Date()

    result := utils.NewTimeWithTimeZone(constants.DefaultTimeZone).Now().Time()

    result := utils.NewTimeWithTimeZone(constants.DefaultTimeZone).Now().DateTime()
}
```  
## バリデーター  
### メールアドレス  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().Email(email)
}
```  
### 身分証明書  
> 中国に適用されます  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().IdentityCard(idCard)
}
```  
## バージョン  
### ソフトウェアバージョンの出力  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Version().Print(fields)
}
```  
## Webプッシュ通知  
:::tip  
このツールキットのメソッドは[PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)に適用されます。  
:::  
### VAP ID Keys  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    privateKey, publicKey, err := utils.GenerateVAPIDKeys()
}
```  
### プッシュ通知の送信  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    privateKey, publicKey, err := utils.WebPush().GenerateVAPIDKeys()
    err := utils.WebPush().SendNotification(privateKey, publicKey, subscription, subscribeEmail, payload)
}
```  
## 証明書  
### ドメインと証明書の一致を検証  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportValidity(domain, pemData)
}
```  
### 証明書と秘密鍵の一致を検証  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportKeyWhetherMatch(certData, keyData)
}
```  
## ドメイン名  
### ドメイン形式の検証   
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().Validate(domain)
}
```  
### ワイルドカードドメイン形式の検証  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().ValidateWithWildcard(domain)
}
```  
### CNAMEレコードの確認  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().LookupCNAME(domain, cnameTarget)
}
```  
## GZIP  
### 圧縮    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Compress(content)
}
```  
### 解凍    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Decompress(content)
}
```  