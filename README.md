# Backend for Library App

Front-end React app repository at https://github.com/NinaKWelch/ninas-library-frontend

## Backend server and GraphQL Playground 

1. Run `npm run watch`

2. Go to http://localhost:4000/

### Example for creating an user

```
mutation {
  createUser(username: "user", favoriteGenre: "crime") {
    username
    favoriteGenre
  }
}
```

Currently password is same for all users: **secret**
