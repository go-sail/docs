---
sidebar_position: 8
---  
# Jwt  
This chapter will introduce how to use JWT.  
## Introduction  
The JWT component encapsulates the most commonly used methods for signing and verifying tokens. When Go-Sail starts up, it activates the JWT component according to the configuration.  

## Usage  
### Issue Token  
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
### Verify Token  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    token := "..."
    valid, err := sail.JWT().ValidToken(token)
}
```

