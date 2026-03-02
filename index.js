import connectionHandlers from './lib/connection.js'
import nodemailer from 'nodemailer'

/**
 * Plugin factory
 *
 * @param {string} pkgName - NPM package name
 * @returns {class}
 */
async function factory (pkgName) {
  const me = this

  /**
   * MasohiMail class
   *
   * @class
   */
  class MasohiMail extends this.app.baseClass.Base {
    constructor () {
      super(pkgName, me.app)
      this.config = {
        connections: []
      }
      this.handlers = connectionHandlers
    }

    init = async () => {
      const handler = async ({ item }) => {
        const { omit, keys } = this.app.lib._
        item.type = item.type ?? 'smtp'
        const types = keys(this.handlers)
        if (!types.includes(item.type)) throw this.error('invalidConnType%s', item.type)
        this.handlers[item.type].call(this, { item })
        return {
          name: item.name,
          options: omit(item, ['type', 'name'])
        }
      }

      const { buildCollections } = this.app.bajo
      this.connections = await buildCollections({ ns: this.ns, handler, container: 'connections', noDefault: false })
    }

    start = async () => {
      for (const c of this.connections ?? []) {
        c.instance = nodemailer.createTransport(c.options)
      }
    }

    // based on: https://gist.github.com/fernandosavio/ff4285f772041d2fb102ff4bece62c20
    stripTags = (html, allowed) => {
      allowed = allowed.trim()
      if (allowed) {
        allowed = allowed.split(/\s+/).map(tag => {
          return '/?' + tag
        })
        allowed = '(?!' + allowed.join('|') + ')'
      }
      return html.replace(new RegExp('(<' + allowed + '.*?>)', 'gi'), '')
    }

    send = async ({ payload = {}, conn = 'default', source } = {}) => {
      const { breakNsPath } = this.app.bajo
      const { find } = this.app.lib._
      const mpa = this.app.waibuMpa
      const stripper = mpa ? mpa.stripHtmlTags.bind(mpa) : this.stripTags
      const { path: name } = breakNsPath(conn)
      const c = find(this.connections, { name })
      // TODO: wrong layout...
      if (!c) throw this.error('notFound%s%s', this.t('connection'), `masohiMail:${name}`)
      const input = { ...payload }
      if (!input.text) input.text = stripper(input.html)
      input.from = input.from ?? c.options.auth.user // can't change from if using smtp
      const resp = await c.instance.sendMail(input)
      return resp
    }
  }

  return MasohiMail
}

export default factory
