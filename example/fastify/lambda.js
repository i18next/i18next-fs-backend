import awsLambdaFastify from 'aws-lambda-fastify'
import app from './app.js'
export const handler = awsLambdaFastify(app)
