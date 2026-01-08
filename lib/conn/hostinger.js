async function hostinger ({ item }) {
  const { has } = this.app.lib._
  item.host = 'smtp.hostinger.com'
  item.port = 587
  item.secure = false
  if (!has(item, 'user')) throw this.error('isRequired%s', 'user')
  if (!has(item, 'pass')) throw this.error('isRequired%s', 'pass')
  item.auth = {
    user: item.user,
    pass: item.pass
  }
  delete item.user
  delete item.pass
}

export default hostinger
