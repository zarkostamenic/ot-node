const Utilities = require('../Utilities');
const { execSync, exec } = require('child_process');

const fs = require('fs');
const path = require('path');

/**
 * Changes the arango password to a randomly generated one
 */
class M6LuksEncryptionMigration {
    constructor({
        config, log,
    }) {
        this.config = config;
        this.log = log;
        this.device = 'encryptedfs.img';
        this.mount = 'ot-node-encrypted';
    }

    /**
     * Run migration
     */
    run() {
        try {
            execSync('cp ../../scripts/luks-encryption.sh .');
            execSync('chmod +x luks-encryption.sh');
            execSync('./luks-encryption.sh', { stdio: 'inherit' });
            execSync('rm ./luks-encryption.sh');

            execSync('cp -r ../../../data /mnt/ot-node-encrypted/');
            execSync('cp -r /var/lib/arangodb3 /mnt/ot-node-encrypted/');
            execSync('chmod 700 /mnt/ot-node-encrypted/');
            execSync('chown -R arangodb:arangodb /mnt/ot-node-encrypted/arangodb3');
            execSync('sed -i \'s#/var/lib/arangodb3/#/mnt/ot-node-encrypted/arangodb3#g\' /etc/arangodb3/arangod.conf');

            execSync('sed -i \'s#/ot-node-encrypted/data/#/mnt/ot-node/#g\' ../../testnet/supervisord.conf');


            execSync('cp ../../scripts/umount-encryption.sh .');
            execSync('chmod +x umount-encryption.sh');
            execSync('./umount-encryption.sh', { stdio: 'inherit' });
            execSync('rm ./umount-encryption.sh');
            // console.log('Running script!');
            // const loop = (execSync('losetup -f').toString()).trim();
            // console.log(`Loop: ${loop}`);
            // // todo what if there is no available loop devices
            // // todo how to determine optimal size
            // execSync(`dd if=/dev/zero of=${this.device} bs=1M count=1024`);
            // exec('echo -e "g\nn\n\n\nw" | fdisk encryptedfs.img');
            //
            //
            // console.log('fdisk completed');
            //
            // execSync(`echo -e "y" | mkfs.ext4 ${this.device}`);
            // console.log('mkfs ext4');
            // execSync(`losetup ${loop} ./${this.device}`);
            //
            // console.log('losetup completed');
            // execSync('apt-get install cryptsetup');
            // console.log('cryptsetup installed');
            // exec('dmsetup remove_all');
            //
            // exec(`echo -e "otnode" | cryptsetup luksFormat ${loop}`);
            // exec(`echo -e "otnode" | cryptsetup luksOpen ${loop} ${this.mount}`);
            // console.log('LUKS encrypted done');
            // exec(`dd if=/dev/zero of=/dev/mapper/${this.mount}`);e
            // console.log('dd if=/dev/zero done');
            // exec(`mkfs.ext4 /dev/mapper/${this.mount}`);
            // console.log('mkfs.ext4 done');
            // // execSync(`rm -rf /${this.mount}`);
            // // execSync(`mkdir /${this.mount}`);
            // console.log('mkdir done');
            // execSync(`mount /dev/mapper/${this.mount} /${this.mount}`);
            // console.log('mounted');
            // todo check if the device is encrypted
            // execSync('mv -r ../../../data /ot-node-encrypted/');
            // execSync('mv -r /var/lib/arangodb3 /ot-node-encrypted/');
            // execSync('chmod 700 /ot-node-encrypted/');
            // todo move change directory path in /etc/arangodb3/arangod.conf
            // todo change data directory path in supervisord

            // execSync(`umount /dev/mapper/${this.mount}`);
            // execSync(`cryptsetup luksClose ${this.mount}`);
            return 0;
        } catch (error) {
            console.log(error);
            this.log.error('LUKS encryption migration failed!');
            this.log.error(error);
            return -1;
        }
    }

    /**
     * Run migration
     */
    mountDevice() {
        try {
            const isMounted = execSync('ls /dev/mapper/ | grep \'evolume\'').toString();
            if (!isMounted) {
                execSync('cp ../../scripts/mount-encryption.sh .');
                execSync('chmod +x mount-encryption.sh');
                execSync('./mount-encryption.sh', { stdio: 'inherit' });
                execSync('rm ./mount-encryption.sh');

                const oldPath = execSync('grep \'/ot-node/data/\' ../../testnet/supervisord.conf')
                if (oldPath) {
                    execSync('sed -i \'s#/ot-node/data/#/mnt/ot-node/#g\' ../../testnet/supervisord.conf');
                }
                return 0;
            }
            return 1;
        } catch (error) {
            console.log(error);
            this.log.error('LUKS encryption migration failed!');
            this.log.error(error);
            return -1;
        }
    }
}

module.exports = M6LuksEncryptionMigration;

console.log('Start!');
const m = new M6LuksEncryptionMigration({ config: null, log: null });
m.run();
// m.mountDevice();
console.log('Stop!');
