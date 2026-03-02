function applyAuth (item) {
  const { has } = this.app.lib._
  if (!has(item, 'user')) throw this.error('isRequired%s', 'user')
  if (!has(item, 'password')) throw this.error('isRequired%s', 'password')
  item.auth = {
    user: item.user,
    pass: item.password
  }
  delete item.user
  delete item.password
}

function generic ({ item }) {
  const { has } = this.app.lib._
  if (!has(item, 'host')) throw this.error('isRequired%s', 'host')
  item.port = item.port ?? 587
  item.secure = item.secure ?? false
  applyAuth.call(this, item)
}

function gmail ({ item }) {
  item.host = 'smtp.gmail.com'
  item.port = 587
  item.secure = false
  applyAuth.call(this, item)
}

function hostinger ({ item }) {
  item.host = 'smtp.hostinger.com'
  item.port = 587
  item.secure = false
  applyAuth.call(this, item)
  delete item.pass
}

export default { generic, gmail, hostinger }
