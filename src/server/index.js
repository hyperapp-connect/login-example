import init from '@hyperconnect/server'
import { random } from '@magic/cryptography'

import * as client from '../client/client'

import db from './db'
// import passport from './passport'

import actions from './services'

// gather settings for the servers.
// these are the default settings and could be omitted.
const props = {
  actions,
  sockets: {
    host: 'localhost',
    port: 3001,
    protocol: 'ws',
  },
  http: {
    host: 'localhost',
    port: 3000,
    protocol: 'http',
    bundleUrl: '/js/bundle.js',
  },
  client,
}

// start websockets and http server
const { socket, http } = init(props)
