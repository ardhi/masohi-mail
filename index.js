import smtp from './lib/conn/smtp.js'
import hostinger from './lib/conn/hostinger.js'
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
      this.handlers = {
        smtp,
        hostinger
      }
    }

    init = async () => {
      const handler = async ({ item }) => {
        const { omit, keys } = this.app.lib._
        item.type = item.type ?? 'smtp'
        const types = keys(this.handlers)
        if (!types.includes(item.type)) throw this.error('invalidConnType%s', item.type)
        await this.handlers[item.type].call(this, { item })
        const result = {
          name: item.name,
          options: omit(item, ['type', 'name'])
        }
        return result
      }

      const { buildCollections } = this.app.bajo
      this.connections = await buildCollections({ ns: this.ns, handler, container: 'connections' })
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

    formatMessage = async (html = '', options = {}) => {
      const mpa = this.app.waibuMpa
      const stripper = mpa ? mpa.stripHtmlTags.bind(mpa) : this.stripTags
      let text = options.messageText
      if (!text) text = stripper(html)
      return { text, html }
    }

    send = async ({ payload = {}, conn, source } = {}) => {
      const { find } = this.app.lib._
      const c = find(this.connections, { name: conn })
      const { data } = payload
      data.options = data.options ?? {}
      // TODO: wrong layout...
      if (!c) throw this.error('notFound%s%s', this.t('connection'), `masohiMail:${conn}`)
      data.from = data.from ?? c.options.auth.user // can't change from if using smtp
      const { text, html } = await this.formatMessage(data.message, data.options)
      data.subject = data.options.subject ?? data.subject
      data.text = text
      data.html = html
      const resp = await c.instance.sendMail(data)
      return resp
    }
  }

  return MasohiMail
}

export default factory
