import { app } from 'hyperapp'
import { location } from '@hyperapp/router'
import { connect } from '@hyperconnect/client'

import { state, actions, view } from './client'

export const connected = app(state, actions, view, document.body)

// socket server connection options
const options = {
  host: 'localhost',
  protocol: 'ws',
  port: 3001,
  state,
}

// wires the app and mounts it.
export const ws = connect(connected, options)

export const router = location.subscribe(connected.location)
