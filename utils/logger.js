const fs = require('fs')
const { createLogger, format, transports } = require('winston')
const { colorize, combine, label, printf, timestamp } = format
const config = require('../config')

if (!fs.existsSync(config.log.dir)) {
    fs.mkdirSync(config.log.dir)
}

const customFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}` 
})

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'node-service' }),
        timestamp(),
        customFormat
    ),
    transports: [
        new transports.File({ filename: `${config.log.dir}/${config.log.error}`, level: 'error' }),
        new transports.File({ filename: `${config.log.dir}/${config.log.file}` })
    ]
})

if(process.env.NODE_ENV !== 'production') {
    const consoleFormat = printf(info => {
        return `${info.level}: ${info.message}`
    })

    logger.add(new transports.Console({
        format: combine(
            colorize(),
            consoleFormat
        )
    }))
}

module.exports = logger

