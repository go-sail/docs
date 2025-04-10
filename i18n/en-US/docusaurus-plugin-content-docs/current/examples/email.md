---
sidebar_position: 7
---  
# Email  
This section will introduce how to use email.  
## Introduction  
The email component provides common email sending operations. It supports a sending pool with multiple goroutines and also supports result callbacks.  
## Usage  
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

