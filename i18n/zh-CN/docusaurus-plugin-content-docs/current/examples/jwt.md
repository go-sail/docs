---
sidebar_position: 8
---  
# Jwt  
本章节将介绍Jwt如何使用。  
## 简介  
Jwt组件封装了最常用的签名和验证令牌的方法。Go-Sail启动时，会根据配置激活Jwt组件。  

## 使用方法  
### 颁发令牌  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    var (
        uid = "10000"
        exp = time.Now().Add(time.Hour * 24).Unix()
    )
    token, err := sail.JWT().MakeToken(uid, exp)
}
```  
### 验证令牌
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    token := "..."
    valid, err := sail.JWT().ValidToken(token)
}
```

