require('dotenv').config();
const path = require('path');
const homedir = require('os').homedir();
const pjson = require('../package.json');

if (!process.env.NODE_ENV) {
    // Environment not set. Use the production.
    process.env.NODE_ENV = 'testnet';
}

const storagePath = process.env.SEQUELIZEDB ?
    process.env.SEQUELIZEDB :
    path.join(homedir, `.${pjson.name}rc`, process.env.NODE_ENV, 'system.db');

module.exports = {
    [process.env.NODE_ENV]: {
        database: 'defaultdb',
        host: 'db-postgresql-fra1-59217-do-user-361965-0.a.db.ondigitalocean.com',
        port: 25060,
        dialect: 'postgres',
        username: 'doadmin',
        password: 'upiv1553gqzmat17',
        native: true,
        ssl: true,
        migrationStorageTableName: 'sequelize_meta',
        logging: false,
        operatorsAliases: false,
        define: {
            underscored: true,
            timestamps: false,
        },
    },
};
