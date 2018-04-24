import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'

import db from './db'

const localStrategy = new LocalStrategy(async (username, password, done) => {
  try {
    const user = await db.get(username)

    if (!user) {
      return done(null, false, { message: 'Incorrect username.' })
    }
  } catch (e) {
    done(e)
  }
})

passport.serializeUser((name, done) => done(null, name))

passport.deserializeUser(async (id, done) => await db.get(name))

passport.use(localStrategy)

export default passport
