import { h } from 'hyperapp'
import { mapActions } from '@hyperconnect/client'

import { validateForm } from '@hyperconnect/form'

import Home from './views'
import Login from './views/Login'
import Register from './views/Register'
import E404 from './views/E404'

import Menu from './components/Menu'

import { Route, location } from '@hyperapp/router'

export const state = {
  location: location.state,

  counter: {
    value: 0,
  },

  user: {
    name: '',
    email: '',
    token: '',
  },

  forms: {
    login: {
      action: 'login',
      method: 'POST',
      inputs: {
        name: {
          type: 'text',
          placeholder: 'Your username',
          min: 6,
          required: true,
        },
        password: {
          type: 'password',
          placeholder: '*********',
          min: 6,
          noState: true,
          required: true,
        },
      },
    },

    register: {
      action: 'register',
      method: 'POST',
      inputs: {
        name: {
          type: 'text',
          placeholder: 'Your username',
          min: 6,
          required: true,
        },
        email: {
          type: 'email',
          placeholder: 'Your email',
          min: 4,
          required: true,
        },
        password: {
          type: 'password',
          placeholder: '*********',
          min: 6,
          noState: true,
          required: true,
        },
        password2: {
          type: 'password',
          equal: 'password',
          placeholder: '*********',
          min: 6,
          noState: true,
          required: true,
        },
      },
    },
  },
}

export const local = {
  location: location.actions,

  user: {
    login: res => () => console.log('user login callback', { res }) || res,
    register: res => () => console.log('register callback', { res }) || res,
  },

  forms: {
    login: {
      validate: validateForm,
    },
    register: {
      validate: validateForm,
    },
  },
}

export const remote = {
  forms: {
    login: {
      submit: res => {
        console.log('login submit_done', { res })
        if (res.ok) {
          actions.user.login(res)
          return
        }

        return {
          errors: res.errors,
        }
      },
    },

    register: {
      submit: res => {
        console.log('register submit done', { state, actions, res })
        if (res.ok) {
          actions.user.register(res)
          return
        }

        return {
          errors: res.errors,
        }
      },
    },
  },
}

// create the actions
export const actions = mapActions(local, remote)

// just a usual hyperapp view
export const view = (state, actions) => (
  <div>
    <Menu />

    <Route path="/login" render={Login(state, actions)} />
    <Route path="/register" render={Register(state, actions)} />
    <Route path="/" render={Home} />
    <Route path="*" render={E404()} />

    {JSON.stringify(state)}
  </div>
)
