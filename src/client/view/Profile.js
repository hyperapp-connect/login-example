import { h } from 'hyperapp'
import { Form } from '@hyperconnect/form'

export const Profile = (state, actions) => router => (
  <div>
    <h2>Profile</h2>
    <div>Name: {state.user.name}</div>
    <div>Email: {state.user.email}</div>
  </div>
)

export default Profile
