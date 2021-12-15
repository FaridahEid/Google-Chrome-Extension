/*const SiphonLogger = require("../../_helpers/logger");
//const Role = require('../../_helpers/role');
const config = require('../../config.json')[process.env.NODE_ENV];
const jwt = require('jsonwebtoken');
//const db = require("../../_helpers/db-interface");
const bcrypt = require("bcryptjs");
const Users = db.users;
const Op = db.Sequelize.Op;

exports.authenticate = (req, res, next) =>{
    SiphonLogger.debug({service:'app.controller.users.authenticate',message:`: authenticating username: ${req.body.username}`});
    Users.findOne({raw: true, where: { username: req.body.username}, logging: false})
        .then(user => {
            if (!user) {
                res.status(400).json({ message: 'Username or Password is incorrect'});
            }
            else {
                bcrypt.compare(req.body.password, user.password).then((pass_check) => {
                    if(pass_check === true){
                        delete user['password'];
                        const token = jwt.sign({ sub: user.id, role: user.role }, config.secret);
                        // console.log(user);
                        res.status(200).json({user,token});
                    }
                    else {
                        res.status(400).json({ message: 'Username or Password is incorrect'});
                    }
                });
            }
        }).catch((err) => {
        res.status(400).json({ message: 'Username or Password is incorrect'});
    });

    /*Users.findOne({raw: true, where: { [Op.and]: [{ username: req.body.username},{ password: req.body.password}]}, attributes: {exclude: ['password']}})
        .then(user => {
            const token = jwt.sign({ sub: user.id, role: user.role }, config.secret);
            // console.log(user);
            res.status(200).json({user,token});
        }).catch(err => {
            res.status(400).json({ message: 'Username or Password is incorrect'});
        });*/
};

/*exports.passwordHash = (password, salt_round) => {
    const hashedPassword = new Promise((resolve, reject) => {
        bcrypt.hash(password, salt_round, function (err, hash) {
            if (err)
                reject(err)
            resolve(hash)
        });
    });
    return hashedPassword;
}

exports.new = (req, res, next) => {
    const saltRounds = 10;
    const user_name = req.body.user_name;
    const email = req.body.email;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const password = req.body.password;
    const user_role = req.body.user_role;

    SiphonLogger.debug({service:'app.controller.users.new',
        message:`creating new ${user_role} account for ${first_name} ${last_name} - ${user_name}`});

    const hashedPassword = new Promise((resolve, reject) => {
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err)
                reject(err)
            resolve(hash)
        });
    });

    return Promise.all([hashedPassword]).then((results) => {
        let my_hashed_password = results.toString().replace(/["]/g, '');

        let new_user_data = {
            username: user_name,
            email: email,
            FirstName: first_name,
            LastName: last_name,
            role: user_role,
            password: my_hashed_password ? my_hashed_password : null
        };

        Users.create(new_user_data, {logging: false})
            .then((user) => {
                // const my_user = {
                //     id: user.id,
                //     username: user.username,
                //     email: email.email,
                //     FirstName: user.FirstName,
                //     LastName: user.LastName,
                //     role: user.role,
                // };
                res.status(200).json(user);
            }).catch((err) => {
                next(err);
                // res.status(400).json({ message: `could NOT create user account!`});
        });
    }).catch((err) => {
        // res.status(400).json({ message: 'could NOT create user account!'});
        next(err);
    });




};

exports.findId = (id) => {

    // const currentUser = req.user;
    // const id = parseInt(req.params.id);

    /* only allow admins to access other user records
    /*if (id !== currentUser.sub && currentUser.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }*/

    /*SiphonLogger.debug({service:'app.controller.users.getById',message:`finding userId: ${id}`});
    return Users.findOne({where: {id: id}, raw: true, attributes: {exclude: ['password']}, logging: false});

    /*  userService.getById(req.params.id)
          .then(user => user ? res.json(user) : res.sendStatus(404))
          .catch(err => next(err));*/
};

/*exports.getAll = (req, res, next) => {

    SiphonLogger.debug({service:'app.controller.users.getAll',message:`getting all users`});
    return Users.findAll({attributes: {exclude: ['password']}, raw: true, logging: false})
        .then(users => {
            res.status(200).json(users);
        }).catch(err => {
            SiphonLogger.error({service:'app.controller.users.getAll',message:`ERROR: ${JSON.stringify(err)}`});
            next(err);
            // res.status(400).json({ message: 'Unable to retrieve user list'});
    });
};

//TODO: fix authorize(Role.Admin) in the router instead of checking here the user.role
/*exports.getById = (req, res, next) => {
    const currentUser = req.user;
    const id = parseInt(req.params.id);

    // only allow admins to access other user records
    if (id !== currentUser.sub && currentUser.role !== Role.Admin) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    SiphonLogger.debug({service:'app.controller.users.getById',message:`getting userId: ${id}`});
    Users.findOne({where: {id: id}, attributes: {exclude: ['password']}, raw: true, logging: false})
        .then(user => {
            if (user && user.id) {
                res.status(200).json(user);
            }
            else {
                res.status(200).json("User NOT Found!");
            }
        }).catch(err => {
            SiphonLogger.error({service:'app.controller.users.getById',message:`ERROR: ${JSON.stringify(err)}`});
            next(err);
            // res.status(400).json({ message: 'Invalid UserId!'});
    });
};*/


