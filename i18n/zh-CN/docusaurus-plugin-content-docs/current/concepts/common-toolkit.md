---
sidebar_position: 6
---

# 通用工具包 
本章节阐述通用工具包是什么。  

### 简介  
通用工具包提供了一套比较丰富的工具方法，可以为开发者提供日常的工具调用。 

### 功能特性  
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

### 使用方法  
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
我们将在[后续章节](../examples/toolkit.md)中详细介绍其目的和用法。
:::  