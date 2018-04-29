import { h } from 'hyperapp'
import { Link } from '@hyperapp/router'

const MenuLink = ({ to, text }) => (
  <li>
    <Link to={to}>{text}</Link>
  </li>
)

export const Menu = ({ user, logout }) => (
  <ul>
    <li>
      <Link to="/">Home</Link>
    </li>
    {!user.jwt && <MenuLink to="/login" text="Login" />}
    {!user.jwt && <MenuLink to="/register" text="Register" />}
    {user.jwt && <MenuLink to="/profile" text="Profile" />}
    {user.jwt && (
      <li>
        <a onclick={logout}>Logout</a>
      </li>
    )}
  </ul>
)

export default Menu
