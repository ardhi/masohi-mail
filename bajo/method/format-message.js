// based on: https://gist.github.com/fernandosavio/ff4285f772041d2fb102ff4bece62c20
function stripTags (html, allowed) {
  allowed = allowed.trim()
  if (allowed) {
    allowed = allowed.split(/\s+/).map(tag => {
      return '/?' + tag
    })
    allowed = '(?!' + allowed.join('|') + ')'
  }
  return html.replace(new RegExp('(<' + allowed + '.*?>)', 'gi'), '')
}

async function autoFormat (message) {
  const { find } = this.app.bajo.lib._
  const handler = find(this.app.bajo.configHandlers, { ext: '.yml' })
  if (handler && handler.writeHandler) return await handler.writeHandler(message, true)
  return JSON.stringify(message, null, 4)
}

async function formatMessage (message, options = {}) {
  const { isPlainObject } = this.app.bajo.lib._
  const mpa = this.app.waibuMpa
  const stripper = mpa ? mpa.stripHtmlTags.bind(mpa) : stripTags
  if (!isPlainObject(message)) return { text: stripper(message) }
  let html = await autoFormat.call(this, message)
  if (!(mpa && options.tpl && options.req)) return { text: stripper(html), html }
  html = await mpa.render(options.tpl, message, options)
  return { text: stripper(html), html }
}

export default formatMessage
