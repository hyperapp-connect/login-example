import { location } from '@hyperapp/router'

import { mapActions, actions as clientActions } from '@hyperconnect/client'

import { validate, handleError } from '@hyperconnect/form'

export const local = {
  location: location.actions,
  viewIfUser: clientActions.viewIfUser,
  viewIfNoUser: clientActions.viewIfNoUser,

  forms: {
    login: {
      validate,
      handleError,
    },
    register: {
      validate,
      handleError,
    },
  },
}

export const remote = {
  login: res => (state, actions) => {
    console.log('user login callback', { res, actions })

    if (!res.ok) {
      return {
        errors: res.errors,
      }
    }

    actions.location.go('/profile')

    return {
      user: res.user,
    }
  },
  register: res => () => {
    console.log('register callback', { res })
    if (!res.ok) {
      return {
        errors: res.errors,
      }
    }

    actions.location.go('/profile')

    return {
      user: res.user,
    }
  },
  logout: res => () => {
    console.log({ res })
    if (!res.ok) {
      return {
        errors: res.errors,
      }
    }

    actions.location.go('/login')

    return {
      user: {},
    }
  },
}

// create the actions
export const actions = mapActions(local, remote)

export default actions
