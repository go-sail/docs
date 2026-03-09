---
sidebar_position: 5
---  
# Security      
This chapter introduces security matters in Go-Sail.  

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
-----END PRIVATE KEY-----`)
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
-----END PRIVATE KEY-----`)
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

            // highlight-start
            passwordDecrypted, _ := sail.Utils().RSA().Decrypt(user.Password, privateKey)
            // highlight-end
            // password not match
            if loginRequest.Password != passwordDecrypted {
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
            
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

## Authorization  
In terms of authorization, the application needs to know the user's identity in the current session and the user's access permissions in order to take further measures, such as allowing or denying access.  

In the code above, after successful user authentication, we issue an access token to the user, which represents the user's identity. Recalling the [Middleware](./middleware) section, we can easily complete user authentication using middleware.  

The step of querying a user's permissions to take further action can be done in several ways. We can retrieve the user's permissions from a database using their identity, or we can pre-issue permissions and authentication information together. For example, user permissions can be packaged into an access token, a step that can be completed during the authentication phase.

Here, we use the industry-popular JWT ([JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)) solution.  

### Activation Configuration  
In order for the JWT components in Go-Sail to work properly, the corresponding configuration needs to be performed before use.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/jwt"
)

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
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
         // highlight-start
        JwtConf: &jwt.Conf{
            Enable: true,
            PublicKey: publicKey,
            PrivateKey: privateKey,
            Algorithm: "RS256",
        },
         // highlight-end
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
            passwordDecrypted, _ := sail.Utils().RSA().Decrypt(user.Password, privateKey)
            // password not match
            if loginRequest.Password != passwordDecrypted {
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
            passwordEncrypted, err := sail.Utils().RSA().Encrypt("password", publicKey) 
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  
At the same time, with the JWT component activated, developers can directly use encryption and decryption schemes through the JWT control plane, which is built into Go-Sail.  
```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/jwt"
)

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
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
        JwtConf: &jwt.Conf{
            Enable: true,
            PublicKey: publicKey,
            PrivateKey: privateKey,
            Algorithm: "RS256",
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
            // highlight-start
            passwordDecrypted, _ := sail.JWT().Decrypt(user.Password, privateKey)
            // highlight-end

            // password not match
            if loginRequest.Password != passwordDecrypted {
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
            passwordEncrypted, err := sail.JWT().Encrypt("password", publicKey) 
            // highlight-end
            sail.GetDBW().Create(&User{Username:"go-sail", password: passwordEncrypted})
        }
    }
)

func main() {
    sail.WakeupHttp("go-sail", conf).Hook(registerRoutes, nil, afterFunc).Launch()
}
```  

### Issue Token  


```go title="main.go" showLineNumbers  
package main

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/sail"
    "github.com/keepchen/go-sail/v3/sail/config"
    "github.com/keepchen/go-sail/v3/lib/db"
    "github.com/keepchen/go-sail/v3/lib/jwt"
)

var (
    privateKey = []byte(`-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUvUDx+LPQ0S+L
+5UmtD2EJw1L953mVCMWBJktBbqPTIhDmrd33+3cNq0t7rXuALhoqZS/53nDchU1
wsCveieNDR7SsdO4HMS4bnxgyuYCkC1ugAdyvJ2FCv7xUppc7PvyIQ1gQS/nOP0w
...
vplU0p7ayaXuNF2t73k/L5f92+8VBuYECEUOXw2xST5gvkPdKGK1xM1cLT6y8TrF
RIXvUK2duHjDxiaPKtANi2P4
-----END PRIVATE KEY-----`)
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
        JwtConf: &jwt.Conf{
            Enable: true,
            PublicKey: publicKey,
            PrivateKey: privateKey,
            Algorithm: "RS256",
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

            passwordDecrypted, _ := sail.Utils().RSA().Decrypt(user.Password, privateKey)
            // password not match
            if loginRequest.Password != passwordDecrypted {
                sail.Response(c).Failure("login failed, username or password not match!")
                return
            }

            // highlight-start
            fields := map[string]any{
                "scopes": []string{
                    "/user/info",
                    "/user/balance",
                    "/user/orders",
                },
            }
            exp := time.Now().Add(time.Hour*24).Unix()
            token, _ := sail.JWT().MakeToken("go-sail", exp, fields)
            // highlight-end
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
Here, when issuing access tokens to users, we grant them access to three resources: 
- /user/info  
- /user/balance  
- /user/orders  

### Authorization completed  

At the same time, we need to modify the corresponding verification code in the authentication routing middleware.  
```go title="main.go" showLineNumbers  
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/keepchen/go-sail/v3/constants"
    "github.com/keepchen/go-sail/v3/sail"
)

...

// ValidateToken validate user's token
func ValidateToken() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.Request.Header.Get("Authorization")
        // highlight-start
        ok, claims, err := sail.JWT().ValidToken(token)
        // highlight-end
        if !ok || err != nil {
            sail.Response(c).Wrap(constants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }
        // highlight-start
        scopes, ok := claims.["scopes"].([]string)
        if !ok {
            sail.Response(c).Wrap(constants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }
        parsedPath := c.Request.URL.Path
        var hit bool
        for _, scope := range scopes {
            if scope == parsedPath {
                hit = true
                break
            }
        }
        if !hit {
            // no permission
            sail.Response(c).Wrap(constants.ErrAuthorizationTokenInvalid, nil).Send()
            return
        }
        // highlight-end

        c.Next()
    }
}

...
```  

## JSON Web Token  
Go-Sail's built-in JWT component is implemented based on the `golang-jwt/jwt` library and supports multiple algorithms, including:      
- RS256 
- RS512 
- HS512 
- EdDSA 
- ES256 
- ES384 
- ES512  

This section provides the key pair generation commands for the corresponding algorithms, which are also based on the secure `openssl` command.  

### rsa (pkcs8)  
```shell  
openssl genrsa -out keypair.pem 2048 && \
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
    -in keypair.pem \
    -out pkcs8.key && \
openssl rsa -in pkcs8.key \
    -pubout -out pkcs8.pem && \
rm -f keypair.pem
```  

### hmac secret  
```shell
openssl rand -base64 32
```

### ed25519  
```shell
openssl genpkey -algorithm ED25519 -out ed25519_private.pem && \
openssl pkey -in ed25519_private.pem -pubout -out ed25519_public.pem
```  

### ecdsa (256)  
```shell
openssl ecparam -name prime256v1 -genkey -noout | \
openssl pkcs8 -topk8 -nocrypt -out ecdsa_p256_private.pem
openssl pkey -in ecdsa_p256_private.pem -pubout -out ecdsa_p256_public.pem
```  

### ecdsa (384)  
```shell
openssl ecparam -name secp384r1 -genkey -noout | \
openssl pkcs8 -topk8 -nocrypt -out ecdsa_p384_private.pem
openssl pkey -in ecdsa_p384_private.pem -pubout -out ecdsa_p384_public.pem
```  

### ecdsa (521)  
```shell
openssl ecparam -name secp521r1 -genkey -noout | \
openssl pkcs8 -topk8 -nocrypt -out ecdsa_p521_private.pem
openssl pkey -in ecdsa_p521_private.pem -pubout -out ecdsa_p521_public.pem
```  
Except for the `HS512` algorithm, for other algorithms, simply configure the key pair in the corresponding public/private key configuration items. For the `HS512` algorithm, please configure the generated result of `hmac secret` in the `HmacSecret` configuration item.  

