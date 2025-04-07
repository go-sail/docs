---
sidebar_position: 8
---  
# Jwt  
本章ではJwtの使用方法について説明します。  
## はじめに  
Jwtコンポーネントは、最も一般的な署名とトークン検証のメソッドをラップしています。Go-Sailの起動時に、設定に基づいてJwtコンポーネントが有効化されます。  

## 使用例  
### トークンの発行  
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
### トークンの検証  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    token := "..."
    valid, err := sail.JWT().ValidToken(token)
}
```

