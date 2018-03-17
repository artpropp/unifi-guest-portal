const express = require('express')
const logger = require('./utils/logger')

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
    res.send('It works!')
    logger.info('request root page')
})

app.listen(port, () => {
    logger.info(`Service is up and listening on ${port}!`)
})

process.on('SIGINT', () => {
    console.log('\r')
    logger.info('Service shutdown through app termination!')
    process.exit(0)
})

