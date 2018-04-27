import { jwt, hash, random } from '@magic/cryptography'

export const login = async (req, res) => {
  const { name, password } = req.body

  let error = undefined
  let user = undefined

  try {
    user = await res
      .db('users')
      .first(['password', 'email', 'id'])
      .where({ name })

    const compared = await hash.compare(password, user.password)

    if (!compared) {
      error = 'Invalid Password'
    }
  } catch (e) {
    if (e.toString().indexOf('NotFoundError') === 0) {
      error = 'User not found'
    } else {
      error = e.toString()
    }
  }

  const data = {
    ok: !error,
  }

  if (error) {
    data.error = error
  } else {
    const token = await random.bytes()
    const { email, id } = user

    const jwts = await jwt.sign({ token, id }, 'secret')
    const jwtv = await jwt.verify({ token, id }, 'secret')
    console.log({ jwts, jwtv })
    data.user = { name, email, token }
  }

  console.log('response data', data)

  res.send(data)
}

export default login
