---
sidebar_position: 11
---  
# スケジュールタスク  
本章ではスケジュールタスクの使用方法について説明します。  
## はじめに  
スケジュールタスクコンポーネントは大きく2つのタイプに分かれます。1つは時間間隔で実行されるタイプです。このタイプのタスクは標準ライブラリの`time.Ticker`を使用して実装されています。もう1つのタイプはLinux Crontab式を使用して実行されるタイプです。このタイプは`robfig/cron`ライブラリをラップしています。スケジュールタスクは開発者に使いやすいシンタックスシュガーを提供します。  
## 使用例  
### 定期実行タスク  
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
以下に一般的なシンタックスシュガーを示します
| シンタックスシュガー | 説明 |
| --- | --- |  
| Every | 指定した間隔で実行 |
| EverySecond | 毎秒実行 |
| EveryFiveSeconds | 5秒ごとに実行 |
| EveryTenSeconds | 10秒ごとに実行 |
| EveryFifteenSeconds | 15秒ごとに実行 |
| EveryTwentySeconds | 20秒ごとに実行 |
| EveryThirtySeconds | 30秒ごとに実行 |
| EveryMinute | 毎分実行 |
| EveryFiveMinutes | 5分ごとに実行 |
| EveryTenMinutes | 10分ごとに実行 |
| EveryFifteenMinutes | 15分ごとに実行 |
| EveryTwentyMinutes | 20分ごとに実行 |
| EveryThirtyMinutes | 30分ごとに実行 |
| Hourly | 毎時実行 |
| EveryFiveHours | 5時間ごとに実行 |
| EveryTenHours | 10時間ごとに実行 |
| EveryTwentyHours | 20時間ごとに実行 |
| Daily | 毎日実行（24時間ごと） |
| Weekly | 毎週実行（7日ごと） |
| Monthly | 毎月実行（30日ごと） |
| Yearly | 毎年実行（365日ごと） |

### Linux Crontab形式のタスク  
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
### 遅延実行（一回限り）  
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
### タスクの重複実行防止  
`WithoutOverlapping()`メソッドは、タスクが同時に重複して実行されることを防ぐ機能です。サービスが複数のレプリカで実行されており、タスクの一意性を確保したい場合に非常に便利です。  
:::warning  
この機能を使用するには、シングルインスタンスモードまたはクラスターモードのいずれかで、事前にRedis接続インスタンスを初期化する必要があります。  
そうしないと**panic**が発生します。
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
タスクを完全にgoroutineにしないように注意してください。そうしないと予期しない状況が発生し、`WithoutOverlapping()`も失敗します。  
:::  
ここでは誤った例を示します：  
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
### キャンセル
まだ開始されていないタスクや実行されていないタスクは直ちにキャンセルされます。実行中のタスクは完了するまで待機し、その後再開されることはありません。  
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
### Crontab式  
#### 使用例  
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
以下に組み込みの式定数を示します  
| 定数      | 説明 |
| --- | --- |
| EveryMinute                           | 毎分0秒に実行 |
| EveryFiveMinute                       | 5分ごとの0秒に実行 |
| EveryTenMinute                        | 10分ごとの0秒に実行 |
| EveryFifteenMinute                    | 15分ごとの0秒に実行 |
| EveryTwentyMinute                     | 20分ごとの0秒に実行 |
| EveryThirtyMinute                     | 30分ごとの0秒に実行 |
| EveryFortyFiveMinute                  | 45分ごとの0秒に実行 |
| FirstDayOfMonth                       | 毎月1日の0時0分に実行 |
| LastDayOfMonth                        | 毎月末日の0時0分に実行 |
| FirstDayOfWeek                        | 毎週月曜日の0時0分に実行 |
| LastDayOfWeek                         | 毎週日曜日の0時0分に実行 |
| TenClockAtWeekday                     | 平日（月曜〜金曜）の午前10時0分に実行 |
| TenClockAtWeekend                     | 週末（土曜・日曜）の午前10時0分に実行 |
| HourlyBetween9And17ClockAtWeekday     | 平日（月曜〜金曜）の午前9時から午後5時まで1時間ごとに実行 |
| HalfHourlyBetween9And17ClockAtWeekday | 平日（月曜〜金曜）の午前9時から午後5時まで30分ごとに実行 |
