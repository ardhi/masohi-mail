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

async function formatMessage (html = '', options = {}) {
  const mpa = this.app.waibuMpa
  const stripper = mpa ? mpa.stripHtmlTags.bind(mpa) : stripTags
  let text = options.messageText
  if (!text) text = stripper(html)
  return { text, html }
}

export default formatMessage
