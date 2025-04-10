---
sidebar_position: 11
---  
# Scheduled Tasks  
This section will introduce how to use scheduled tasks.  
## Introduction  
The scheduling task component is roughly divided into two categories. One type executes according to time intervals. This type of task is implemented using the standard library `time.Ticker`. The other type executes using Linux Crontab expressions. This type encapsulates the `robfig/cron` library under the hood. The scheduling task provides developers with simple and easy-to-use syntactic sugar.  
## Usage  
### Interval-based Tasks  
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
Here are the commonly used syntactic sugar methods:
| Method | Description |
| --- | --- |
| Every | Execute once every specified interval |
| EverySecond | Execute once per second |
| EveryFiveSeconds | Execute once every 5 seconds |
| EveryTenSeconds | Execute once every 10 seconds | 
| EveryFifteenSeconds | Execute once every 15 seconds |
| EveryTwentySeconds | Execute once every 20 seconds |
| EveryThirtySeconds | Execute once every 30 seconds |
| EveryMinute | Execute once per minute |
| EveryFiveMinutes | Execute once every 5 minutes |
| EveryTenMinutes | Execute once every 10 minutes |
| EveryFifteenMinutes | Execute once every 15 minutes |
| EveryTwentyMinutes | Execute once every 20 minutes |
| EveryThirtyMinutes | Execute once every 30 minutes |
| Hourly | Execute once per hour |
| EveryFiveHours | Execute once every 5 hours |
| EveryTenHours | Execute once every 10 hours |
| EveryTwentyHours | Execute once every 20 hours |
| Daily | Execute once per day (every 24 hours) |
| Weekly | Execute once per week (every 7 days) |
| Monthly | Execute once per month (every 30 days) |
| Yearly | Execute once per year (every 365 days) |

### Linux Crontab-style Tasks  
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
### Delayed (One-time) Tasks  
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
### Preventing Task Overlap  
The `WithoutOverlapping()` method prevents tasks from running simultaneously. It's particularly useful when your service has multiple replicas and you want to ensure task uniqueness.  
:::warning  
This feature requires initializing a Redis connection instance in advance, whether in standalone or cluster mode.
Otherwise, it will **panic**.  
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
Note that your task should not be entirely a goroutine, otherwise unexpected situations may occur and `WithoutOverlapping()` will fail.  
:::  
Here's an example of what NOT to do:  
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
### Cancellation  
Tasks that have not yet started or are not running will be cancelled directly. Tasks that are currently running will wait for completion and then will not start again.  
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
### Crontab Expression  
#### Usage  
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
The following lists the built-in expression constants  
| Constant    | Description |
| --- | --- |
| EveryMinute                           | At 0 seconds of every minute |
| EveryFiveMinute                       | At 0 seconds of every 5 minutes |
| EveryTenMinute                        | At 0 seconds of every 10 minutes |
| EveryFifteenMinute                    | At 0 seconds of every 15 minutes | 
| EveryTwentyMinute                     | At 0 seconds of every 20 minutes |
| EveryThirtyMinute                     | At 0 seconds of every 30 minutes |
| EveryFortyFiveMinute                  | At 0 seconds of every 45 minutes |
| FirstDayOfMonth                       | At 00:00 on the first day of every month |
| LastDayOfMonth                        | At 00:00 on the last day of every month |
| FirstDayOfWeek                        | At 00:00 on Monday (first day of week) |
| LastDayOfWeek                         | At 00:00 on Sunday (last day of week) |
| TenClockAtWeekday                     | At 10:00 on every weekday (Monday through Friday) |
| TenClockAtWeekend                     | At 10:00 on every weekend (Saturday and Sunday) |
| HourlyBetween9And17ClockAtWeekday     | Every hour from 9:00 to 17:00 on weekdays (Monday through Friday) |
| HalfHourlyBetween9And17ClockAtWeekday | Every 30 minutes from 9:00 to 17:00 on weekdays (Monday through Friday) |
