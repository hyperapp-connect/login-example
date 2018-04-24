export const capitalize = str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`

export const validateInput = ({ input, inputs }) => {
  if (!input || input.type === 'submit' || !input.name) {
    return
  }

  const { name, value, type, required, max, min, equal } = input
  let error = undefined

  if (required && !value) {
    error = 'Please enter a value'
  } else if (min && value.length < parseInt(min, 10)) {
    error = `${capitalize(name)} is too short`
  } else if (max && value.length > parseInt(max, 10)) {
    error = `${capitalize(name)} is too long`
  }

  if (type === 'email' && value.indexOf('@') === -1) {
    error = 'Email must be valid'
  }

  if (equal) {
    const ele = inputs[equal].value
    if (!value || !ele || value !== ele) {
      error = `${capitalize(equal)}s must be equal`
    }
  }

  return error
}

export const validateForm = ({ evt, state }) => {
  const errors = {}
  let hasErrored = false

  const inputs = evt.currentTarget.getElementsByTagName('input')

  Object.keys(state.inputs)
    .filter(k => state.inputs[k].type !== 'submit')
    .map(key => {
      const input = state.inputs[key]
      input.name = key
      input.value = inputs[key].value
      const err = validateInput({ input, inputs })

      if (err) {
        errors.inputs = errors.inputs || {}
        errors.inputs[key] = err
        hasErrored = true
      }
    })

  return { errors, hasErrored }
}
