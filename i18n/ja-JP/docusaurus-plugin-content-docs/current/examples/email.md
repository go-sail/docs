---
sidebar_position: 7
---  
# Email  
本章ではメールの使用方法について説明します。  
## はじめに  
メールコンポーネントは一般的なメール送信操作を提供します。複数のgoroutineを使用した送信プールをサポートし、結果のコールバックも可能です。  
## 使用例  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/email"
)

func main() {
    conf := email.Conf{}
    pool := email.NewPool(conf)
    pool.Emit()
    defer func() {
        pool.Done()
    }()

    cb := func(e *email.Envelope, err error) {
        if err != nil {
            fmt.Println("Send email error:", err, " | receiver:", e.To)
        } else {
            fmt.Println("Send mail success!", " | receiver:", e.To)
        }
    }

    envelopes := []*email.Envelope{
        {
            From:     conf.From,
            Subject:  conf.Subject,
            MimeType: mimeType,
            Body:     bodyStr,
            To:       to,
            Callback: cb,
        },
        {
            From:     conf.From,
            Subject:  conf.Subject,
            MimeType: mimeType,
            Body:     bodyStr,
            To:       to,
            Callback: cb,
        },
        {
            From:     conf.From,
            Subject:  conf.Subject,
            MimeType: mimeType,
            Body:     bodyStr,
            To:       to,
            Callback: cb,
        },
        ...
    }

    for index := range envelopes {
        pool.Mount(index, envelopes[index])
    }
}
```  

