import { h } from 'hyperapp'
import { Route, location, Redirect } from '@hyperapp/router'

import { Home } from './Home'
import { Login } from './Login'
import { Profile } from './Profile'
import { Register } from './Register'
import { E404 } from './E404'

import Menu from '../components/Menu'

const checkShouldRender = (p = {}) => console.log({p}) || p.in ? p.jwt : !p.jwt

const ProtectedRoute = props => (
  checkShouldRender(props)
  ? <Route {...props} />
  : <Redirect to="/login" />
)

// just a usual hyperapp view
export const view = (state, actions) => (
  <div>
    <Menu user={state.user} logout={actions.logout} />

    <Route path="/login" render={Login(state, actions)} />
    <Route path="/register" render={Register(state, actions)} />
    <Route path="/profile" render={Profile(state, actions)} />
    <Route path="/" render={Home} />
    <Route path="*" render={E404()} />

    {JSON.stringify(state)}
  </div>
)

export default view
