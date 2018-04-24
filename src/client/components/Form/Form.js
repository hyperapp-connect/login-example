import { h } from 'hyperapp'

import { ErrorMsg } from './ErrorMsg'

import { Input } from './Input'

import { validateForm } from './lib/validateInput'

export const submit = (state, actions) => evt => {
  evt.preventDefault()

  const { hasErrored } = validateForm({ evt, form, state })

  if (hasErrored) {
    return
  }

  const data = {}
  Object.keys(state.inputs).map(key => {
    data[key] = state.inputs[key].value
  })

  form.submit(data)
}

export const Form = ({ actions, errors, state, form, title, submitValue }) => (
  <form
    novalidate
    action={state.action}
    method={state.method || 'POST'}
    onsubmit={submit(state, actions)}
    onchange={evt => form.validate({ evt, form, state })}
  >
    {title && (
      <legend>
        <h2>{title}</h2>
      </legend>
    )}
    <ErrorMsg error={state.errors && state.errors.submit} />
    <fieldset>
      {Object.keys(state.inputs).map(k => (
        <div>
          <Input name={k} {...state.inputs[k]} />
          <ErrorMsg error={state.hasErrored && state.errors.inputs[k]} />
        </div>
      ))}
    </fieldset>

    <input type="submit" value={submitValue || 'Submit'} />
  </form>
)

export default Form
