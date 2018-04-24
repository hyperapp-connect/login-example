import { h } from 'hyperapp'

export const Input = (props = {}) => (
  <input
    type={props.type || 'text'}
    placeholder={props.placeholder}
    min={props.min}
    max={props.max}
    equal={props.equal}
    required={props.required}
    name={props.name}
  />
)

export default Input
