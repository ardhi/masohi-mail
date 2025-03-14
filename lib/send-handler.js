async function send (payload = {}) {
  const { find } = this.lib._
  let { to, cc, bcc, from, subject, message, conn, options = {} } = payload
  const c = find(this.connections, { name: conn })
  if (!c) throw this.error('notFound%s%s', this.print.write('connection'), `${conn}@masohiMail`)
  from = c.options.auth.user // can't change from if using smtp
  const { text, html } = await this.formatMessage(message, options)
  if (options.subject) subject = options.subject
  const resp = await c.instance.sendMail({ from, to, cc, bcc, subject, text, html })
  return resp
}

export default send
