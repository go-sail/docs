---
sidebar_position: 14
---  
# 工具包  
本章节将介绍工具包如何使用。  
## 简介  
Go-Sail提供了一个工具包，包含一些常用的工具功能。  
:::tip  
随着版本的更新，支持的工具函数也会相应更新。
:::  
## AES  
### 编码  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Aes().Encode(rawStr, key)
}
```  
### 解码  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    decoded, err := utils.Aes().Decode(encoded, key)
}
```  
## Base64  
### 编码  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded, err := utils.Base64().Encode(rawBytes)
}
```  
### 解码  
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
### 格式化日期
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
### 解析日期
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
## 文件  
### 保存到目的地  
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
### 获取内容  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.File().GetContents("path/to/filename")
}
```  
### 写入内容  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().PutContents(content, "path/to/filename")
}
```  
### 追加内容  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    err := utils.File().AppendContents(content, "path/to/filename")
}
```  
### 断言是否存在
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.File().Exists("path/to/filename")

    ok, err := utils.File().ExistsWithError("path/to/filename")
}
```  
### 获取扩展名
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ext := utils.File().Ext("path/to/filename")
}
```  
### 逐行读取  
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
### 获取本地ip  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    localIp, err := utils.IP().GetLocal()
}
```  
## MD5  
### 编码
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    encoded := utils.MD5().Encode(rawStr)
}
```  
## Redis锁  
:::tip  
redis锁会在内部自动续期，开发者无需关心内部细节。  
:::  
:::warning  
若是单独使用，你必须首先使用“redis.InitRedis”或“redis.InitRedisCluster”初始化连接。  
:::  
### 尝试获取锁  
> 非阻塞式的  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.RedisLocker().TryLock(key)
}
```  
### 获取锁  
> 阻塞式的  

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
### 解锁  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.RedisLocker().Unlock(key)
}
```  
## RSA  
### 加密  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Encrypt(rawString, publicKey)
}
```  
### 解密    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.RSA().Decrypt(rawString, publicKey)
}
```  
## 信号  
### 监听系统信号  
> 阻塞式的  

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
### 加密  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBEncrypt(hexKey, rawStr)
}
```  
### 解密  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result, err := utils.SM4().ECBDecrypt(hexKey, rawStr)
}
```  
## 字符串  
### 包装字符  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Wordwrap(rawStr, 64, "\n")
}
```  
### 包装Redis键  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().WrapRedisKey(appName, key)
}
```  
### 随机字母串  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomLetters(length)
}
```  
### 随机数字串  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomDigitalChars(length)
}
```  
### 随机复合字符  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().RandomComplexString(length)
}
```  
### 反转  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Reverse(rawStr)
}
```  
### 打乱  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().Shuffle(rawStr)
}
```  
### 填充（左侧）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingLeft(rawStr, padChar, length)
}
```  
### 填充（右侧）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingRight(rawStr, padChar, length)
}
```  
### 填充（两侧）  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.String().PaddingBoth(rawStr, padChar, length)
}
```  
## 数字  
### 范围随机整数  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomInt64(start, end)
}
```  
### 范围随机浮点数  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().RandomFloat64(start, end)
}
```  
### 幂计算  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Number().Pow(x, y)
}
```  
## Swagger  
### 打印概览注释  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    result := utils.Swagger().PrintSummaryInfo(param)
}
```  
### 打印处理函数注释  
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
## 验证器  
### 邮箱号  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().Email(email)
}
```  
### 身份证  
> 适用于中国  

```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    ok := utils.Validator().IdentityCard(idCard)
}
```  
## 版本  
### 打印软件版本  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Version().Print(fields)
}
```  
## Web推送  
:::tip  
此工具包方法适用于[PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)。
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
### 发送推送通知  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    privateKey, publicKey, err := utils.WebPush().GenerateVAPIDKeys()
    err := utils.WebPush().SendNotification(privateKey, publicKey, subscription, subscribeEmail, payload)
}
```  
## 证书  
### 验证域名与证书是否匹配    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportValidity(domain, pemData)
}
```  
### 验证证书与私钥是否匹配    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Cert().ReportKeyWhetherMatch(certData, keyData)
}
```  
## 域名  
### 验证域名格式    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().Validate(domain)
}
```  
### 验证通配符域名格式    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().ValidateWithWildcard(domain)
}
```  
### 检查CNAME记录    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Domain().LookupCNAME(domain, cnameTarget)
}
```  
## GZIP  
### 压缩    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Compress(content)
}
```  
### 解压缩    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/utils"
)

func main() {
    utils.Gzip().Decompress(content)
}
```  