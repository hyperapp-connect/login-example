exports.up = async db => {
  // if (db.schema.hasColumn('users', 'role')) {
  //   return
  // }

  return db.schema.alterTable('users', table => {
    const roles = ['superadmin', 'admin', 'moderator', 'user', 'unconfirmed']
    table.enu('role', roles).notNullable().default('unconfirmed')
  })
}

exports.down = db => {
  db.schema.alterTable('user', table => {
    table.dropColumn('role')
  })
}
