---
sidebar_position: 7
---  
# Email  
本章节将介绍邮件如何使用。  
## 介绍  
邮件组件提供常用的邮件发送操作。它支持以多goroutine的方式的发送池，并且还支持结果回调。  
## 使用方法  
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

