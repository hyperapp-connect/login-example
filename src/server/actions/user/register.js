import { hash, random } from '@magic/cryptography'

export const register = async (req, res) => {
  let error = undefined
  let user = undefined

  const { name, password, password2, email } = req.body
  console.log({ body: req.body })

  try {
    const pwHash = await hash(password)

    if (password !== password2) {
      throw new Error('Password mismatch')
    }

    await res.db.table('users').insert({ name, password: pwHash, email })
  } catch (e) {
    console.log(e.code, e.code === 'SQLITE_CONSTRAINT')
    if (e.code === 'SQLITE_CONSTRAINT') {
      error = 'User or email already used'
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
    data.user = { name, email, token }
  }

  res.send(data)
}

export default register
