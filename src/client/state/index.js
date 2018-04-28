import { location } from '@hyperapp/router'
import { state as clientState } from '@hyperconnect/client'

export const state = {
  location: location.state,
  auth: clientState.auth,

  counter: {
    value: 0,
  },

  user: {
    name: '',
    email: '',
    jwt: '',
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

export default state
