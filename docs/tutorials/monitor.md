---
sidebar_position: 12
---  
# Monitor        
This chapter introduces Go-Sail's monitoring.  

## Introduction  
For running application services, service monitoring is of critical importance; it renders the operational status of applications more transparent and clear, while also contributing significantly to performance optimization and—in a microservices environment—elastic scaling.  

Currently, Go-Sail utilizes two approaches—Prometheus and PProf—to implement telemetry and observability.  

## Metrics  
Go-Sail utilizes Prometheus to monitor various service metrics. You can collect this data via the metrics endpoint for subsequent use. The following metrics are currently being collected:  
- HTTP Request Latency
- HTTP Status Code Counts
- CPU Utilization
- Memory Utilization
- Disk Utilization
- Network Traffic  

## PProf  
