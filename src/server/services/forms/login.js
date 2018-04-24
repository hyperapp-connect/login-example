export const submit = async (req, res) => {
  const { name, password } = req.body

  let error = undefined
  let user = undefined
  try {
    user = await db.get(name)

    const compared = password && password === user.password

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
    data.token = random.bytes()
  }

  console.log('response data', data)

  res.send(data)
}
