const Skyway = require('../models/db.model.js');
const { validateToken } = require('./jwtValidate.js');

exports.validateUser = (user_token, result) => {
    // Get user email
    validateToken(user_token, (err, response) => {
        if (err) return result(err, null);
        else {
            // Check if user exist
            Skyway.getUserByEmail(response.email, (err, user) => {
                if (err) return result(err, null);
                else if (!(user && user.length)) {
                    return result("User doesn't exist.", null);
                } else result(null, user[0]);
            });
        }
    });
}