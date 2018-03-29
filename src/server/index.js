import init from '@hyperconnect/server'

import * as client from '../client/client'

// define the server side action handlers.
const actions = {
  v0: {
    counter: {
      down: (req, res) => {
        const value = Math.max(0, parseInt(req.body.value, 10) - 1)
        res.send({ value })
      },
      down10: (req, res) => {
        const value = Math.max(0, parseInt(req.body.value, 10) - 10)
        res.send({ value })
      },
      up: (req, res) => {
        const value = parseInt(req.body.value, 10) + 1
        res.send({ value })
      },
      up10: (req, res) => {
        const value = parseInt(req.body.value, 10) + 10
        res.send({ value })
      },
    },
  },
}

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
