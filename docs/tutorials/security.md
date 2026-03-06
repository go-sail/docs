---
sidebar_position: 5
---  
# Security      
This chapter introduces safety matters in Go-Sail.  

## Introduction  
Regardless of the type of application or system, security is inevitably the foremost important consideration.   

Security encompasses all aspects, and we cannot exhaustively list all situations, but regarding web applications, here we will list commonly used security protection solutions.  

## Authentication  
Taking the previous login interface as an example, we implemented a method to check whether a certain user exists in the database table, and to compare whether the password entered by the user matches the password stored in the database.   
However, there is a problem here: the password is stored in the database in plain text, which is very dangerous and unprofessional. Generally speaking, we should encrypt the user's password before storing it in the database to prevent unforeseen damage in case of a data leak.  

### Encryption  
Currently, there are various encryption/decryption algorithms. Here, we demonstrate using the commonly used RSA encryption and decryption scheme.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----
`)
	publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
            Logger: db.Logger{
                Level: "warn",
                SlowThreshold: 100,
                SkipCallerLookup: true,
                IgnoreRecordNotFoundError: true,
                Colorful: false,
            },
            NowFunc: func() time.Time {
                return time.Now().In(time.UTC)
            },
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
        var loginRequest LoginRequest
        c.ShouldBind(&loginRequest)

        var user User
        sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
        // user not exist
        if len(loginRequest.Username) == 0 {
            sail.Response(c).Failure("login failed, username or password not match!")
            return
        }
        // password not match
        if loginRequest.Password != user.Password {
            sail.Response(c).Failure("login failed, username or password not match!")
            return
        }

        token := "this-is-a-valid-token"
        sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            // highlight-start
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            // highlight-end
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
You can use the `openssl` command to generate the public and private keys required for the RSA algorithm. The `openssl` command is generally available on MacOS, Linux, and Windows systems.  
You can generate a `pkcs8` format public and private key using the following command.  
```shell  
openssl genrsa -out keypair.pem 2048 && \
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
    -in keypair.pem \
    -out pkcs8.key && \
openssl rsa -in pkcs8.key \
    -pubout -out pkcs8.pem && \
rm -f keypair.pem
```  
Among them, `pkcs8.key` is the private key, and `pkcs8.pem` is the public key.  

### Decryption  
The counterpart to encryption is decryption. When we need to decrypt ciphertext, we can use the decryption function provided by Go-Sail. For example, in the example above, we need to compare whether the password entered by the user is the same as the password in the database.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
)

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----
`)
	publicKey = []byte(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1L1A8fiz0NEvi/uVJrQ9
...
KTJQ+GGzUqOGzruYQ5sM3TnU8Avb4OF36uyADBwA4bP944tKSNSET7BC3N0UerRo
QwIDAQAB
-----END PUBLIC KEY-----`)
    conf = &config.Config{
        DBConf: db.Conf{
            Enable: true,
            DriverName: "mysql",
            Mysql: db.MysqlConf{
                Read: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
                Write: db.MysqlConfItem{
                    Host: "127.0.0.1",
                    Port: 3306,
                    Username: "root",
                    Password: "root",
                    Database: "go_sail",
                },
            }, 
            Logger: db.Logger{
                Level: "warn",
                SlowThreshold: 100,
                SkipCallerLookup: true,
                IgnoreRecordNotFoundError: true,
                Colorful: false,
            },
            NowFunc: func() time.Time {
                return time.Now().In(time.UTC)
            },
        },
    }
    registerRoutes = func(ginEngine *gin.Engine) {
        ginEngine.POST("/login", func(c *gin.Context){
        var loginRequest LoginRequest
        c.ShouldBind(&loginRequest)

        // highlight-start
        var user User
        sail.GetDBR().Where(&User{Username: loginRequest.Username}).First(&user)
        // user not exist
        if len(loginRequest.Username) == 0 {
            sail.Response(c).Failure("login failed, username or password not match!")
            return
        }
        // password not match
        if loginRequest.Password != user.Password {
            sail.Response(c).Failure("login failed, username or password not match!")
            return
        }
        // highlight-end

        token := "this-is-a-valid-token"
        sail.Response(c).Data(token)
        })
        userGroup := ginEngine.Group("/user").Use(ValidateToken())
        {
        userGroup.GET("/balance", ...).
                GET("/info", ...).
                GET("/logout", ...)
        }
    }
    afterFunc = func() {
        sail.GetDBW().AutoMigrate(&User)
        var user User
        sail.GetDBW().Where(&User{Username:"go-sail"}).First(&user)
        if len(user.Username) == 0 {
            
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  