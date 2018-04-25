const { hash } = require('@magic/cryptography')

exports.seed = async knex => {
  await knex('users').del()
  // Inserts seed entries
  await knex('users').insert([
    { name: 'testing', email: 'test@test.com', password: await hash('testing') },
  ])
}
