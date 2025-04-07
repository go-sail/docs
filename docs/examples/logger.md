---
sidebar_position: 2
---  
# Logger  
This section will introduce how to use the logger component.  

## Introduction  
The Logger component is a secondary encapsulation of the `uber-go/zap` logging library, enriching and enhancing business functionality.  
When Go-Sail starts, if enabled, it will automatically initialize the logger component. After that, developers can directly call it through the `sail` keyword without worrying about internal details.  
```go title="main.go" showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    // highlight-start
    sail.GetLogger()
    // highlight-end
}
```  
## Exporters  
The role of exporters is to transfer logs to other locations. Generally, exporters should work asynchronously internally to provide optimal performance.  
This is optional. If not enabled, logs will only be output to local files.  
### Redis List (Single Instance)  
The `Exporter.Provider` option needs to be set to `redis`. Additionally, you need to configure the corresponding Redis connection information.  
### Redis List (Cluster)  
The `Exporter.Provider` option needs to be set to `redis-cluster`. Additionally, you need to configure the corresponding Redis connection information.  
### Nats Topic  
The `Exporter.Provider` option needs to be set to `nats`. Additionally, you need to configure the corresponding Nats connection information.  
### Kafka Topic  
The `Exporter.Provider` option needs to be set to `kafka`. Additionally, you need to configure the corresponding Kafka connection information.  
### Others  
The above exporters are built-in implementations of Go-Sail. If you want to use other exporters, you can implement "zapcore.WriteSyncer" yourself.  
## Usage  
### Regular Usage  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger().Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### Specify Module  
Specify the log file module, which essentially means splitting logs by filename. This configuration is useful when there are many logs that need to be divided by functionality. It works in conjunction with the "Filename" field. For example, if the "Filename" field value is "running.log" and one of the "Modules" values is "schedule", then the schedule's filename will be "running_schedule.log". You can specify the module for logging through the `sail.GetLogger()` method, like: `sail.GetLogger("schedule")`.  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger("schedule").Error("looks like something went wrong", 
        zap.String("err", err.Error()))
}
```  
### Serialized Fields  
```go title="main.go"  showLineNumbers  
import (
    "github.com/keepchen/go-sail/v3/lib/logger"
    "github.com/keepchen/go-sail/v3/sail"
)

func main() {
    sail.GetLogger("schedule").Error("looks like something went wrong", 
        zap.String("value", sail.MarshalInterfaceValue(anyValue)),
        zap.String("err", err.Error()))
}
```  
### Others  
For more native usage methods, please refer to the official documentation of [uber-go/zap](https://github.com/uber-go/zap).  