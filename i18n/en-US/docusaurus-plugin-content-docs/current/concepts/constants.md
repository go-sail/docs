---
sidebar_position: 4
---

# Constants  
This section explains what constants are.  
### Introduction  
In Go-Sail, some system constants are defined and stored in the constants package for use in specific scenarios.  
- **code**  
It is used to define business response codes or error codes.  
    :::tip  
    The `RegisterCodeSingle()` and `RegisterCodeTable()` functions provide powerful help for injecting custom error codes and error messages.  
    We will cover their purposes and usage in detail in subsequent chapters.
    :::  
- **errors**  
It is used to define error codes and error messages. It also supports i18n.  
- **i18n**  
Used to define language codes, following the ISO-3166-1 standard.  
- **keys**  
Currently used to define prefix and suffix identifiers for public and private keys.  
- **sail**  
Contains the framework's logo characters and version number.  
- **status**  
Used to define boolean values for successful and failed responses.  
- **time**  
Currently defines timezone characters and date printing templates for various time zones around the world.  