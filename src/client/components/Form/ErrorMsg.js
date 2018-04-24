import { h } from 'hyperapp'

export const ErrorMsg = ({ error }) => {
  if (!error || error.length === 0) {
    return
  }

  if (typeof error === 'string') {
    return (
      <div
        style={{
          color: 'red',
        }}
      >
        {error}
      </div>
    )
  }

  if (Array.isArray(error) || typeof error === 'object') {
    return Object.keys(error).map(key =>
      ErrorMsg({ error: `${key} ${JSON.stringify(error[key])}` }),
    )
  }
}

export default ErrorMsg
