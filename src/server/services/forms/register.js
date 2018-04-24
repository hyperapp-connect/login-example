export const submit = async (req, res) => {
  let error = undefined
  let user = undefined
  try {
    const { name, password, email } = req.body
    console.log('user registration', { name, password, email })

    user = await db.put(name, { password, email })
  } catch (e) {
    error = e
  }

  const data = {
    ok: !error,
  }

  const { password, password2, ...userData } = user

  if (error) {
    data.error = error
  } else {
    data.user = userData
    data.user.token = random.bytes()
  }

  res.send(data)
}
