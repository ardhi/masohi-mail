import smtp from '../lib/conn/smtp.js'
import hostinger from '../lib/conn/hostinger.js'

const handlers = {
  smtp,
  hostinger
}

async function handler ({ item }) {
  const { omit, keys } = this.app.bajo.lib._
  item.type = item.type ?? 'smtp'
  const types = keys(handlers)
  if (!types.includes(item.type)) throw this.error('invalidConnType%s', item.type)
  await handlers[item.type].call(this, { item })
  const result = {
    name: item.name,
    options: omit(item, ['type', 'name'])
  }
  return result
}

async function init () {
  const { buildCollections } = this.app.bajo
  this.connections = await buildCollections({ ns: this.name, handler, container: 'connections' })
}

export default init
