require('dotenv').config();
const express = require('express');
const path = require('path');
const logger = require('./utils/logger');
const request = require('request-promise');

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const baseUrl = process.env.UNIFI_BASEURL;
const apiSiteUri = '/api/s/' + process.env.UNIFI_SITE;
const deleteVouchers = process.env.UNIFI_DELETE_VOUCHERS | false;
const redirectUri = process.env.REDIRECT_URI;

app.use(express.static(path.join(__dirname, '../build')));

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.post('/api/authorize', (req, res) => {
    const { name, email, code, mac, url } = req.body;
    const ip = req.ip;
    var validVoucher;

    let options = {
        method: 'POST',
        jar: true,
        json: true,
        strictSSL: false,
        uri: baseUrl + '/api/login',
        body: {
            username: process.env.UNIFI_USER,
            password: process.env.UNIFI_PASSWORD
        }
    }
    request(options)
    .then(() => {
        logger.debug('api: logged in, fetching vouchers ...')
        options.uri = baseUrl + apiSiteUri + '/stat/voucher';
        options.method = 'GET'
        options.body = {};
        return request(options)
    })
    .then((response) => {
        var isValid = false;
        var additionals = {};
        const { data } = response;
        logger.debug('api: vouchers fetched (0)' + data && 'api: vouchers fetched (' + data.length + ')');
        if (data !== 'undefined') {
            data.forEach((voucher) => {
                if (voucher.code === code.replace('-', '')) {
                    isValid = true;
                    validVoucher = voucher;
                    additionals.minutes = voucher.duration;
                    additionals.up = voucher.qos_rate_max_up;
                    additionals.down = voucher.qos_rate_max_down;
                    additionals.bytes = voucher.qos_usage_quota;
                }
            })
        }

        if (isValid) {
            logger.debug('api: found valid voucher')
            options.method = 'POST'
            options.uri = baseUrl + apiSiteUri + '/cmd/stamgr'
            options.body = {
                cmd: 'authorize-guest',
                mac,
                code,
                ...additionals,
            }
            return request(options);
        }

        return Promise.reject();
    })
    .then(() => {
        if (!deleteVouchers || validVoucher.quota === 0) return;
        logger.debug('api: removing valid voucher ...' + validVoucher._id)
        options.uri = baseUrl + apiSiteUri + '/cmd/hotspot';
        options.body = {
            cmd: 'delete-voucher',
            _id: validVoucher._id,
        };
        return request(options);
    })
    .then(() => {
        if (deleteVouchers && validVoucher.quota !== 0) logger.debug('api: voucher removed');
        logger.info('Authoried|' + name + '|' + email + '|' + mac + '|' + ip + '|voucher:' + code)
        options.uri = baseUrl + '/api/logout'
        return request(options)
    })
    .then(() => {
        res.send({
            success: true,
            validCode: true,
        });
    })
    .catch(err => {
        logger.debug('api: error callback - ' + err);
        logger.warn('Unauthorized|' + name + '|' + email + '|' + mac + '|' + ip + '|voucher:' + code)
        options.method = 'POST';
        options.uri = baseUrl + '/api/logout';
        request(options);

        res.status(403).send({
            success: false,
            validCode: false,
        });
    })
})

app.listen(port, () => {
    logger.info(`Service is up and listening on ${port}!`)
})

process.on('SIGINT', () => { 
    console.log('\r')
    logger.info('Service shutdown through app termination!')
    process.exit(0)
})
