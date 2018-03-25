import { h, app } from 'hyperapp'
import { log, connect, mapActions } from 'hyperconnect/client'

// just a usual hyperapp state
export const state = {
  counter: {
    value: 0,
  },
}

// just usual hyperapp actions.
// careful, remote actions overwrite actions.
export const local = {
  local: val => () => ({ input: val }),
  counter: {
    up20: val => state => ({ value: state.value + 20 }),
  },
}

// remote actions first get wrapped to allow server roundtrips
// and then merged into the actions
export const remote = {
  counter: {
    down: res => () => res,
    down10: res => () => res,
    up: res => () => res,
    up10: res => () => res,
  },
}

// create the actions
export const actions = mapActions(local, remote)

// just a usual hyperapp view
export const view = (state, actions) => (
  <div>
    <h1>{state.counter.value}</h1>

    <div>{JSON.stringify(state)}</div>

    <button onclick={() => actions.counter.up()}>+</button>
    <button onclick={() => actions.counter.up10()}>+10</button>
    <button onclick={() => actions.counter.up20()}>+20</button>

    <button onclick={() => actions.counter.down()}>-</button>
    <button onclick={() => actions.counter.down10()}>-10</button>

    <input type="text" onkeyup={e => actions.local(e.target.value)} />
    <span>text, no server roundtrip: {state.input}</span>
  </div>
)

export const connected = log(app)(state, actions, view, document.body)

// socket server connection options
const options = {
  host: 'localhost',
  protocol: 'ws',
  port: 3001,
}

// wires the app and mounts it.
export const ws = connect(connected, options)
