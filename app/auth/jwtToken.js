var jwt = require('jsonwebtoken');
const config = require('config');

module.exports = {

    generateToken: function (playerDetails) {

        var claims = {
            sub: 'authentication',
            iss: 'http://bigpesa.com',
            permissions: 'all',
            identity: {
                source: 'loyalty-nz',
                playerId: playerDetails.playerId,
                appId: playerDetails.appId,
                date: new Date()
            }
        };

        var token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + config.jwt_sessions.expires_in, data: claims }, config.jwt_sessions.private_key);

        return token;
    }
}; 