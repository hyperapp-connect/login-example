import { hash, random } from '@magic/cryptography'

export const submit = async (req, res) => {
  const { name, password } = req.body

  let error = undefined
  let user = undefined

  try {
    user = await res
      .db('users')
      .first(['password', 'email'])
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
    data.user = { name, ...user, token }
  }

  console.log('response data', data)

  res.send(data)
}
