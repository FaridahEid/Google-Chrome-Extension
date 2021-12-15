const jwt = require('jsonwebtoken');

exports.createToken = (email, token) => {
    let secret = process.env.JWT_SECRET || "supersecret";
    let expireTime = parseInt(process.env.JWT_EXPIRES_IN) || 6000;

    return jwt.sign(
        {
            email: email,
            token: token
        },
        secret,
        {
            expiresIn: expireTime
        }
    );
}

exports.validateToken = (token, result) => {
    let secret = process.env.JWT_SECRET || "supersecret";

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.log("Unauthorized user.");
            result(err, null);
        } else {
            result(null, decoded);
        }
    });
}