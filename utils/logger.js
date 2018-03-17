const fs = require('fs')
const winston = require('winston')
const config = require('../config')

if (!fs.existsSync(config.log.dir)) {
    fs.mkdirSync(config.log.dir)
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: `${config.log.dir}/${config.log.error}`, level: 'error' }),
        new winston.transports.File({ filename: `${config.log.dir}/${config.log.file}` })
    ]
})

if(process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }))
}

module.exports = logger
