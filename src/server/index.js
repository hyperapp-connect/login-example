import init from '@hyperconnect/server'
import { random } from '@magic/cryptography'

import * as client from '../client/client'

import actions from './services'

import db from './db'

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
  db,
}

// start websockets and http server
init(props)
