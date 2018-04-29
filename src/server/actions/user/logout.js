import { hash, random } from '@magic/cryptography'

export const logout = async (req, res) => {
  const { name, password, jwt } = req.body

  res.send({ ok: true })
}

export default logout
