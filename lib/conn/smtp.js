async function smtp ({ item }) {
  const { has } = this.app.bajo.lib._
  if (!has(item, 'host')) throw this.error('isRequired%s', 'host')
  item.port = item.port ?? 587
  item.secure = item.secure ?? false
  item.auth = item.auth ?? {}
  if (!has(item.auth, 'user')) throw this.error('isRequired%s', 'user')
  if (!has(item.auth, 'pass')) throw this.error('isRequired%s', 'pass')
}

export default smtp
