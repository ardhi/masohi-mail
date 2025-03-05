import nodemailer from 'nodemailer'

async function start () {
  for (const c of this.connections ?? []) {
    c.instance = nodemailer.createTransport(c.options)
  }
}

export default start
