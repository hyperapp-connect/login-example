import { h } from 'hyperapp'
import { Form } from '@hyperconnect/form'

export const Register = (state, actions) => () => (
  <div>
    <h1>Register</h1>
    <Form
      actions={actions.forms.register}
      state={state.forms.register}
      app={{ state, actions }}
      action={actions.register}
    />
  </div>
)

export default Register
