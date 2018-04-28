exports.up = async db => {
  if (db.schema.hasTable('users')) {
    await db.schema.dropTableIfExists('users')
  }

  return db.schema.createTable('users', table => {
    table.increments('id')
    table.string('name', 30).notNullable()
    table.string('password').notNullable()
    table.string('email').notNullable()
    table.timestamps()

    table.unique(['name', 'email'])
  })
}

exports.down = db => {
  db.schema.dropTable('users')
}
