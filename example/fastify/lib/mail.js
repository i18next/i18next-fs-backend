import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pug from 'pug'
import mjml2html from 'mjml'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default (template, data) => {
  const mjml = pug.renderFile(join(__dirname, '../mails', `${template}.pug`), data)
  const { html, errors } = mjml2html(mjml)
  if (errors && errors.length > 0) throw new Error(errors[0].message)
  return html
}
