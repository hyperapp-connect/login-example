import { JWT } from '@magic/cryptography'

import * as client from '../client/client'

import { actions } from './actions'
import { db } from './lib'

const jwt = new JWT()

// gather settings for the servers.
// these are the default settings and could be omitted.
export const props = {
  actions,
  client,
  db,
  jwt,
  http: {
    host: 'localhost',
    port: 3000,
    protocol: 'http',
    bundleUrl: '/js/bundle.js',
  },
  sockets: {
    host: 'localhost',
    port: 3001,
    protocol: 'ws',
  },
}

export default props
