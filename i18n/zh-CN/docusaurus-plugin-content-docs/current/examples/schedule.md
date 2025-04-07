---
sidebar_position: 11
---  
# 计划任务  
本章节将介绍计划任务如何使用。  
## 简介  
计划任务组件大致分为两类。一种是按照时间间隔执行。此类任务是使用标准库`time.Ticker`实现的。另一种类型是使用Linux Crontab表达式执行的。该类底层封装了`robfig/cron`类库。计划任务为开发者提供了简单易用的语法糖。  
## 使用方法  
### 间隔性的  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    schedule.NewJob("taskName", task).EverySecond()
    <-ch //waiting...
}
```  
下面列出常用的语法糖  
| 语法糖      | 描述 |
| --- | --- |  
| Every | 每隔多久执行一次 |
| EverySecond | 每秒执行一次 |
| EveryFiveSeconds | 每5秒执行一次 |
| EveryTenSeconds | 每10秒执行一次 |
| EveryFifteenSeconds | 每15秒执行一次 |
| EveryTwentySeconds | 每20秒执行一次 |
| EveryThirtySeconds | 每30秒执行一次 |
| EveryMinute | 每分钟执行一次 |
| EveryFiveMinutes | 每5分钟执行一次 |
| EveryTenMinutes | 每10分钟执行一次 |
| EveryFifteenMinutes | 每15分钟执行一次 |
| EveryTwentyMinutes | 每20分钟执行一次 |
| EveryThirtyMinutes | 每30分钟执行一次 |
| Hourly | 每1小时执行一次 |
| EveryFiveHours | 每5小时执行一次 |
| EveryTenHours | 每10小时执行一次 |
| EveryTwentyHours | 每20小时执行一次 |
| Daily | 每天执行一次（每24小时） |
| Weekly | 每周执行一次（每7天） |
| Monthly | 每月执行一次（每30天） |
| Yearly | 每年执行一次（每365天） |

### Linux Crontab风格的    
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    schedule.NewJob("taskName", task).RunAt("* * * * *")
    <-ch //waiting...
}
```  
### 延迟性的 (一次性的)  
```go title="main.go" showLineNumbers  
import (
    "time"
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    schedule.NewJob("taskName", task).RunAfter(5*time.Second)
    <-ch //waiting...
}
```  
### 防止任务堆叠  
`WithoutOverlapping()`方法的作用是防止任务同时重复运行。当你的服务运行多个副本并且你希望确保任务的唯一性时，它非常有用。  
:::warning  
该功能需要提前初始化Redis连接实例，无论是单机模式还是集群模式。
否则它会**panic**。
:::
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    schedule.NewJob("taskName", task).WithoutOverlapping().EverySecond()
    <-ch //waiting...
}
```  
:::note  
需要注意的是，你的任务不应该完全是一个goroutine，否则会出现意想不到的情况，并且`WithoutOverlapping()`也会失败。  
:::  
这里给出了一个错误的示范：  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        // highlight-start
        go func() {
            ...
            fmt.Println("taskName...")
            ...
        }
        // highlight-end
    }
    schedule.NewJob("taskName", task).WithoutOverlapping().EverySecond()
    <-ch //waiting...
}
```  
### 取消  
尚未启动或未运行的任务将被直接取消。 正在运行的任务将等待其运行完成，然后不再启动。  
```go title="main.go" showLineNumbers  
import (
    "time"
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    cancel := schedule.NewJob("taskName", task).WithoutOverlapping().EverySecond()
    time.Sleep(5*time.Second)
    // highlight-start
    cancel()
    // highlight-end
    <-ch //waiting...
}
```  
### Crontab表达式   
#### 使用方法
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/schedule"
)

func main() {
    ch := make(chan, struct{})
    task := func() {
        fmt.Println("taskName...")
    }
    schedule.NewJob("taskName", task).WithoutOverlapping().RunAt(schedule.EveryFiveMinute)
    <-ch //waiting...
}
```  
下面列出内置的表达式常量  
| 常量      | 描述 |
| --- | --- |
| EveryMinute                           | 每分钟的开始第0秒 |
| EveryFiveMinute                       | 每5分钟的开始第0秒 |
| EveryTenMinute                        | 每10分钟的开始第0秒 |
| EveryFifteenMinute                    | 每15分钟的开始第0秒 |
| EveryTwentyMinute                     | 每20分钟的开始第0秒 |
| EveryThirtyMinute                     | 每30分钟的开始第0秒 |
| EveryFortyFiveMinute                  | 每45分钟的开始第0秒 |
| FirstDayOfMonth                       | 每月的第一天的0点0分 |
| LastDayOfMonth                        | 每月的最后一天的0点0分 |
| FirstDayOfWeek                        | 每周的第一天（周一）的0点0分 |
| LastDayOfWeek                         | 每周的最后一天（周天）的0点0分 |
| TenClockAtWeekday                     | 每个工作日（周一~周五）的上午10点0分 |
| TenClockAtWeekend                     | 每个周末（周六和周日）的上午10点0分 |
| HourlyBetween9And17ClockAtWeekday     | 每个工作日（周一~周五）的上午9点0分到下午5点0分每小时一次 |
| HalfHourlyBetween9And17ClockAtWeekday | 每个工作日（周一~周五）的上午9点0分到下午5点0分每半时一次 |
