import { h } from 'hyperapp'
import { Form } from '@hyperconnect/form'

export const view = (state, actions) => () => (
  <div>
    <h1>Register</h1>
    <Form form={actions.forms.register} state={state.forms.register} />
  </div>
)

export default view
