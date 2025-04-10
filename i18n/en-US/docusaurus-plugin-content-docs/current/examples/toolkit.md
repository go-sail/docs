---
sidebar_position: 13
---  
# Toolkit  
This section will introduce how to use the toolkit.  
## Introduction  
Go-Sail provides a toolkit that contains some commonly used utility functions.  
:::tip  
As versions are updated, the supported utility functions will be updated accordingly.  
:::  
## AES  
### Encode  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Aes().Encode(rawStr, key)
}
```  
### Decode  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    decoded, err := utils.Aes().Decode(encoded, key)
}
```  
## Base64  
### Encode  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Base64().Encode(rawBytes)
}
```  
### Decode  
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
### Format Date  
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
### Parse Date  
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
## File  
### Save to Destination  
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
### Get Contents  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.File().GetContents("path/to/filename")
}
```  
### Write Contents  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().PutContents(content, "path/to/filename")
}
```  
### Append Contents  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().AppendContents(content, "path/to/filename")
}
```  
### Assert File Exists  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.File().Exists("path/to/filename")

    ok, err := utils.File().ExistsWithError("path/to/filename")
}
```  
### Get File Extension  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ext := utils.File().Ext("path/to/filename")
}
```  
### Read Line by Line  
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
### Get Local IP  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    localIp, err := utils.IP().GetLocal()
}
```  
## MD5  
### Encode  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded := utils.MD5().Encode(rawStr)
}
```  
## Redis Lock
:::tip  
The redis lock will automatically renew internally, developers don't need to worry about internal details.  
:::  
:::warning  
If used independently, you must first initialize the connection using "redis.InitRedis" or "redis.InitRedisCluster".  
:::  
### Try to Get Lock  
> Non-blocking  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.RedisLocker().TryLock(key)
}
```  
### Get Lock  
> Blocking mode  

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
### Unlock  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.RedisLocker().Unlock(key)
}
```  
## RSA  
### Encrypt  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Encrypt(rawString, publicKey)
}
```  
### Decrypt    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Decrypt(rawString, publicKey)
}
```  
## Signal  
### Listen for system signals  
> Blocking mode  

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
### Encrypt  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBEncrypt(hexKey, rawStr)
}
```  
### Decrypt  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBDecrypt(hexKey, rawStr)
}
```  
## String  
### Wrap characters  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Wordwrap(rawStr, 64, "\n")
}
```  
### Wrap Redis key  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().WrapRedisKey(appName, key)
}
```  
### Random letters  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomLetters(length)
}
```  
### Random digits  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomDigitalChars(length)
}
```  
### Random complex characters  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomComplexString(length)
}
```  
### Reverse  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Reverse(rawStr)
}
```  
### Shuffle  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Shuffle(rawStr)
}
```  
### Left padding  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingLeft(rawStr, padChar, length)
}
```  
### Right padding  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingRight(rawStr, padChar, length)
}
```  
### Padding (both sides)  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingBoth(rawStr, padChar, length)
}
```  
## Number  
### Random integer in range  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomInt64(start, end)
}
```  
### Random float in range  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomFloat64(start, end)
}
```  
### Power calculation  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().Pow(x, y)
}
```  
## Swagger  
### Print summary comments  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Swagger().PrintSummaryInfo(param)
}
```  
### Print controller comments  
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
## Validator  
### Email address  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().Email(email)
}
```  
### Identity Card  
> Applicable to China  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().IdentityCard(idCard)
}
```  
## Version  
### Print software version  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Version().Print(fields)
}
```  
## Web Push  
:::tip  
This toolkit method is applicable to [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps).  
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
### Send Push Notification  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    privateKey, publicKey, err := utils.WebPush().GenerateVAPIDKeys()
    err := utils.WebPush().SendNotification(privateKey, publicKey, subscription, subscribeEmail, payload)
}
```  
## Certificate  
### Verify Domain and Certificate Match  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportValidity(domain, pemData)
}
```  
### Verify Certificate and Private Key Match    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportKeyWhetherMatch(certData, keyData)
}
```  
## Domain  
### Validate Domain Format    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().Validate(domain)
}
```  
### Validate Wildcard Domain Format    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().ValidateWithWildcard(domain)
}
```  
### Check CNAME Records    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().LookupCNAME(domain, cnameTarget)
}
```  
## GZIP  
### Compress    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Compress(content)
}
```  
### Decompress    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Decompress(content)
}
```  