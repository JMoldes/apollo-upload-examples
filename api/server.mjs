import apolloServerExpress from 'apollo-server-express'
import express from 'express'
import resolvers from './resolvers'
import typeDefs from './types'

import cookieParser from 'cookie-parser'
import ConnectRedisSessions from 'connect-redis-sessions'

const app = express()

const fnCRS = ConnectRedisSessions({
  app: 'apollo-upload',  // A simple string as appname or a function to calc the name on every request.
  ttl: 1000000, // Redis session timeout to wipe the session on idle time
  cookie: { // Cookie configuration. If nothing is set a browser session cookie will be used
    maxAge: 10 * 60*60*24 * 1000,
    httpOnly: true
  }
})

app.use(cookieParser())

app.use(fnCRS)

// middleware to simulate a session redis
app.use((req, res, next) => {
  if (req.session && !req.session.id) {
    // The first time a session is created in redis and a cookie is sent to the client
    req.session.upgrade('user', 60*60*24 * 10, () => {
      req.session.idApp= 3000
      req.session.idUser = 1
      req.session.email = 'userName@gmail.com'
      req.session.nombre = 'UserName'
    })
    console.log('Created Session')
  }
  next() 
})

const server = new apolloServerExpress.ApolloServer({
  typeDefs,
  resolvers,
  uploads: {
    // Limits here should be stricter than config for surrounding
    // infrastructure such as Nginx so errors can be handled elegantly by
    // graphql-upload:
    // https://github.com/jaydenseric/graphql-upload#type-uploadoptions
    maxFileSize: 10000000, // 10 MB
    maxFiles: 20
  }
})

server.applyMiddleware({ app })

app.listen(process.env.PORT, error => {
  if (error) throw error

  // eslint-disable-next-line no-console
  console.info(
    `Serving http://localhost:${process.env.PORT} for ${process.env.NODE_ENV}.`
  )
})
