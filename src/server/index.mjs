import init from 'hyperconnect/server'

// define the server side action handlers.
// nesting coming soon
const actions = {
  v0: {
    counter: {
      down: (req, res) => {
        console.log('v0.counter.down')
        const value = Math.max(0, parseInt(req.body.value, 10) - 1)
        res.send(['counter.down', { value }])
      },
      down10: (req, res) => {
        const value = Math.max(0, parseInt(req.body.value, 10) - 10)
        res.send(['counter.down10', { value }])
      },
      up: (req, res) => {
        const value = parseInt(req.body.value, 10) + 1
        res.send(['counter.up', { value }])
      },
      up10: (req, res) => {
        const value = parseInt(req.body.value, 10) + 10
        res.send(['counter.up10', { value }])
      },
    },
  },
}

// gather settings for the servers.
// these are the default settings.
const props = {
  actions,
  sockets: {
    host: 'localhost',
    port: 3001,
    protocol: 'ws'
  },
  http: {
    host: 'localhost',
    port: 3000,
    protocol: 'http',
    bundleUrl: '/js/bundle.js',
  },
}

// start websockets and http server
const { socket, http } = init(props)
console.log('started servers')
