---
sidebar_position: 6
---

# 一般的なツールキット  
このセクションでは、Generic Toolkit について説明します。  

### 導入  
一般的なツールキットは、開発者に日常的なツール呼び出しを提供できる、比較的豊富なツール メソッドのセットを提供します。 

### 特徴  
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

### 使い方  
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
その目的と使い方については[次の章](../examples/toolkit.md)で詳しく紹介します。  
:::  