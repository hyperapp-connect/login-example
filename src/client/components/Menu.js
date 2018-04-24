import { h } from 'hyperapp'
import { Link } from '@hyperapp/router'

export const view = () => (
  <ul>
    <li>
      <Link to="/">Home</Link>
    </li>
    <li>
      <Link to="/login">Login</Link>
    </li>
    <li>
      <Link to="/register">Register</Link>
    </li>
  </ul>
)

export default view
