---
sidebar_position: 5
---

# HTTP Toolkit  
This chapter explains what the HTTP toolkit is.  

### Introduction
The HTTP toolkit provides unified responses, routing middleware, and common request and response entities.  

### Routing Middleware  
>The routing middleware is compatible with gin, and you can still use them independently.

The routing middleware provides several common functionalities:  
- **Parse Client Language**  
- **Trace Log**  
- **Print Request Payload**  
- **Prometheus Exporter**  
- **Rate Limiter**  
- **CORS (Cross-origin resource sharing)**  
:::tip   
We will explain their purposes and usages in detail in the [next chapter](../examples/http.md).
:::  

### Request and Response Entity Specifications
- **dto**
    - base
    - pagination  
    - error
- **vo**  
    - pagination  
:::tip   
We will explain their purposes and usages in detail in the [next chapter](../examples/http.md).  
:::  
### Unified Response
First, unified responses ensure that the response data structure is highly consistent and complete. Second, some data values in the response entity are maintained by Go-Sail and don't require much attention from developers, which helps developers focus their energy elsewhere.
The general structure and format is as follows:  
```json showLineNumbers 
{
  "code": 200,
  "data": null,
  "message": "SUCCESS",
  "requestId": "5686efa5-c747-4f63-8657-e6052f8181a9",
  "success": true,
  "ts": 1670899688591
}
```  
:::tip  
The response handler needs to be used in conjunction with registered error codes and routing middleware, making it relatively complex compared to out-of-the-box component libraries. Therefore, standalone usage is not highly recommended.  
However, if you like the functionality provided by the response handler and want to use it independently, and you happen to have an exploratory spirit, feel free to try combining it in your own way.
:::