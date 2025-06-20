import smtp from './lib/conn/smtp.js'
import hostinger from './lib/conn/hostinger.js'
import nodemailer from 'nodemailer'

async function factory (pkgName) {
  const me = this

  return class MasohiMail extends this.lib.BajoPlugin {
    constructor () {
      super(pkgName, me.app)
      this.alias = 'mail'
      this.dependencies = ['masohi']
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
        const { omit, keys } = this.lib._
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
      this.connections = await buildCollections({ ns: this.name, handler, container: 'connections' })
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

    send = async (payload = {}) => {
      const { find } = this.lib._
      let { to, cc, bcc, from, subject, message, conn, options = {} } = payload
      const c = find(this.connections, { name: conn })
      if (!c) return
      // TODO: wrong layout...
      if (!c) throw this.error('notFound%s%s', this.print.write('connection'), `${conn}@masohiMail`)
      from = c.options.auth.user // can't change from if using smtp
      const { text, html } = await this.formatMessage(message, options)
      if (options.subject) subject = options.subject
      const resp = await c.instance.sendMail({ from, to, cc, bcc, subject, text, html })
      return resp
    }
  }
}

export default factory
