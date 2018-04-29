import { h } from 'hyperapp'
import { Redirect } from '@hyperapp/router'
import { Form } from '@hyperconnect/form'

export const Login = (state, actions) => router => (
  <div oncreate={actions.viewIfNoUser}>
    <h2>Login</h2>
    <Form
      state={state.forms.login}
      actions={actions.forms.login}
      app={{ state, actions }}
      action={actions.login}
    />
  </div>
)

export default Login
