import awsLambdaFastify from '@fastify/aws-lambda'
import app from './app.js'
export const handler = awsLambdaFastify(app)
