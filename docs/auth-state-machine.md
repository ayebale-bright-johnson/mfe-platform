# Auth State Machine

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> UNINITIALIZED

    UNINITIALIZED --> AUTHENTICATING : Shell init / login()

    AUTHENTICATING --> AUTHENTICATED : getUser() success / callback processed
    AUTHENTICATING --> ERROR : OIDC init failed / network error

    AUTHENTICATED --> TOKEN_REFRESHING : accessTokenExpiring
    AUTHENTICATED --> SESSION_EXPIRED : accessTokenExpired
    AUTHENTICATED --> LOGGED_OUT : User logout
    AUTHENTICATED --> ERROR : Unexpected error

    TOKEN_REFRESHING --> AUTHENTICATED : signinSilent() success
    TOKEN_REFRESHING --> SESSION_EXPIRED : Refresh failed after retries
    TOKEN_REFRESHING --> ERROR : Refresh error (recoverable)

    SESSION_EXPIRED --> AUTHENTICATING : User re-login
    SESSION_EXPIRED --> LOGGED_OUT : User chooses logout

    ERROR --> AUTHENTICATING : Recovery attempt / retry
    ERROR --> LOGGED_OUT : Unrecoverable / user gives up

    LOGGED_OUT --> AUTHENTICATING : User login

    note right of AUTHENTICATED
        Happy path state.
        User has valid tokens.
        MFEs can access protected resources.
    end note

    note right of ERROR
        Recoverable errors trigger
        exponential backoff retry
        (max 3 attempts, base 1s, max 30s)
    end note

    note right of SESSION_EXPIRED
        Terminal for current session.
        User must re-authenticate.
    end note
```

## Transition Table

| From | To | Trigger |
|------|-----|---------|
| UNINITIALIZED | AUTHENTICATING | Shell init, login() call |
| AUTHENTICATING | AUTHENTICATED | Successful auth |
| AUTHENTICATING | ERROR | Auth failure |
| AUTHENTICATED | TOKEN_REFRESHING | Token expiring event |
| AUTHENTICATED | SESSION_EXPIRED | Token expired event |
| AUTHENTICATED | LOGGED_OUT | User logout |
| AUTHENTICATED | ERROR | Unexpected error |
| TOKEN_REFRESHING | AUTHENTICATED | Silent renew success |
| TOKEN_REFRESHING | SESSION_EXPIRED | Renew failed after retries |
| TOKEN_REFRESHING | ERROR | Renew error |
| SESSION_EXPIRED | AUTHENTICATING | Re-login attempt |
| SESSION_EXPIRED | LOGGED_OUT | User chooses logout |
| ERROR | AUTHENTICATING | Recovery/retry |
| ERROR | LOGGED_OUT | Give up |
| LOGGED_OUT | AUTHENTICATING | New login |
