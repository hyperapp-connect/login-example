import { h } from 'hyperapp'
import { Form } from '@hyperconnect/form'

export const view = (state, actions) => () => (
  <div>
    <h2>Login</h2>
    <Form
      form={actions.forms.login}
      state={state.forms.login}
      actions={actions}
    />
  </div>
)

export default view
