'use strict';

const Sequelize = require('sequelize');

module.exports = (sequelize) => { //USF TEAM: DO NOT WORRY ABOUT FOR NOW
    return sequelize.define('user', {
        email: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        token: {
            type: Sequelize.STRING(255),
            allowNull: false
        }
    }, {
        sequelize,
        tableName: 'user',
        timestamps: false
    });
};
