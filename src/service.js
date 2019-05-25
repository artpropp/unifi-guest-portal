require('dotenv').config()
const express = require('express')
const logger = require('./utils/logger')

const app = express()
const port = process.env.PORT || 3000

app.use((req, res) => {
    res.send('It works!')

    const path = req.path.replace(/^\/+|\/+$/g,'')
    logger.info(path)
    if (path === 'guest/s/default') {
      logger.info('----------------------------------------')
      parseQuery(req)
      logger.info('----------------------------------------')
    }

})

app.listen(port, () => {
    logger.info(`Service is up and listening on ${port}!`)
})

process.on('SIGINT', () => { 
    console.log('\r')
    logger.info('Service shutdown through app termination!')
    process.exit(0)
})

const parseQuery = ({query, ip}) => {
    const date = new Date(query.t * 1000)
    const mac = query.id
    const url = query.url

    logger.info('IP address - ' + ip)
    logger.info('MAC address - ' + mac)
    logger.info(date)
}

