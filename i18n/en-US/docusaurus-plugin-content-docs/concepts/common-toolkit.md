---
sidebar_position: 6
---

# Common Toolkit
This chapter explains what the common toolkit is.

### Introduction
The common toolkit provides a rich set of utility methods that developers can use for everyday operations.  

### Features  
- **AES**  
- **Base64**  
- **CRC**  
- **Datetime**  
- **File**  
- **Heap**  
- **IP**  
- **MD5**  
- **Redis lock**  
- **RSA**  
- **Singal**  
- **SM4**  
- **String**  
- **Time**  
- **Validator**  
- **Version**  
- **Webpush**

### Usage  
```go title="main.go" showLineNumbers  
import (
  "github.com/keepchen/go-sail/v3/utils"
)

func main() {
  result, err := utils.Aes().Encode(rawStr, key)
  result := utils.MD5().Encode(rawStr)
}
```  
:::tip   
We will cover their purposes and usage in detail in the [next chapter](../examples/toolkit.md).  
:::  