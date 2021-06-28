import fastify from 'fastify'
import pov from 'point-of-view'
import pug from 'pug'
import { register, i18next } from './lib/i18n.js'
import mail from './lib/mail.js'

const port = process.env.PORT || 8080

const app = fastify()
app.register(pov, { engine: { pug } })
register(app)

app.get('/email', (request, reply) => {
  const html = mail('invitation', {
    title: request.t('invitation.subject'),
    t: request.t,
    firstname: request.query.name,
    invitationLink: 'https://locize.com'
  })
  // would normally send this via some mail provider...
  reply.type('text/html')
  reply.send(html)
})

app.get('/raw', (request, reply) => {
  reply.send(request.t('home.title'))
})

app.get('/', (request, reply) => {
  reply.view('/views/index.pug')
})

if (import.meta.url === `file://${process.argv[1]}`) {
  // called directly
  app.listen(port, (err) => {
    if (err) return console.error(err)
    console.log(i18next.t('server.started', { port }))
    console.log(i18next.t('server.started', { port, lng: 'de' }))
    console.log(i18next.t('server.started', { port, lng: 'it' }))
  })
} else {
  // imported as a module, i.e. when used in aws-lambda
}

export default app
