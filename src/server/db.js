import levelup from 'levelup'
import leveldown from 'leveldown'

// 1) Create our store
const db = levelup(leveldown('./db'))

//
// const put = async () => {
//
//   try {
//     // 2) Put a key & value
//     const insert = await db.put('name', 'levelup')
//   }
//   catch (e) {
//     throw e
//   }
//
//   try {
//     // 3) Fetch by key
//     const res = db.get('name', (err, value) => {
//       if (err) return console.log('Ooops!', err) // likely the key was not found
//
//       // Ta da!
//       console.log('name=' + value)
//     })
//   }
//   catch (e) {
//     throw e
//   }
// }

export default db
