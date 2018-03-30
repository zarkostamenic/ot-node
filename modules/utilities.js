const SystemStorage = require('./Database/systemStorage');
const pem = require('pem');
const fs = require('fs');
var logger = require('winston');

class Utilities {
    /**
     * Get configuration parameters from SystemStorage database, table node_config
     * @returns {Promise<void>}
     */
    static loadConfig() {
        return new Promise((resolve, reject) => {
            const db = new SystemStorage();
            db.connect().then(() => {
                db.runSystemQuery('SELECT * FROM node_config', []).then((rows) => {
                    [this.config] = rows;
                    resolve(rows[0]);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Returns winston logger
     * @returns {*} - log function
     */
    static getLogger() {
        try {
            logger.add(logger.transports.File, { filename: 'log.log', colorize: true, prettyPrint: true });
            logger.remove(logger.transports.Console);
            logger.add(logger.transports.Console, { colorize: true });
        } catch (e) {
            // console.log(e);
        }
        return logger;
    }

    /**
     * Get information of selected graph storage database
     * @returns {Promise<any>}
     */
    static loadSelectedDatabaseInfo() {
        return new Promise((resolve, reject) => {
            const db = new SystemStorage();
            db.connect().then(() => {
                db.runSystemQuery('SELECT gd.* FROM node_config AS nc JOIN graph_database gd ON nc.selected_graph_database = gd.id', []).then((rows) => {
                    [this.selectedDatabase] = rows;
                    resolve(rows[0]);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    static getSelectedDatabaseInfo() {
        if (!this.config) {
            throw Error('Configuration not loaded from system database');
        } else {
            return this.config;
        }
    }

    /**
    * Generate Self Signed SSL for Kademlia
    * @return {Promise<any>}
    * @private
    */
    static generateSelfSignedCertificate(config) {
        return new Promise((resolve, reject) => {
            pem.createCertificate({
                days: 365,
                selfSigned: true,
            }, (err, keys) => {
                if (err) {
                    return reject(err);
                }
                fs.writeFileSync(`${__dirname}/../keys/${config.ssl_key_path}`, keys.serviceKey);
                fs.writeFileSync(`${__dirname}/../keys/${config.ssl_certificate_path}`, keys.certificate);
                return resolve();
            });
        });
    }

    /**
    * Generates private extended key for identity
    * @param config
    * @param kadence
    */
    static createPrivateExtendedKey(config, kadence) {
        if (!fs.existsSync(`${__dirname}/../keys/${config.private_extended_key_path}`)) {
            fs.writeFileSync(
                `${__dirname}/../keys/${config.private_extended_key_path}`,
                kadence.utils.toHDKeyFromSeed().privateExtendedKey,
            );
        }
    }
}

module.exports = Utilities;

