import * as client from '../client/client'

import { actions, db } from './lib'

// gather settings for the servers.
// these are the default settings and could be omitted.
export const props = {
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

export default props
