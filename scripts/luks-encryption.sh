#!/bin/bash

# DEVICE=encryptedfs.img
# LOOP=loop4
# MOUNT=ot-node-encrypted
#LOOP=$(losetup -f)

DEVICE=encryptedfs.img
VOLUME=evolume
MOUNT=ot-node-encrypted

apt-get install cryptsetup

#create a file
fallocate -l 1024M /root/${DEVICE}
#create luks container in the file
cryptsetup -y luksFormat /root/${DEVICE}
#opens the LUKS device and maps it to a name that we supply, in our case creating a file at /dev/mapper/volume1
cryptsetup luksOpen /root/${DEVICE} ${VOLUME}
#create file system
mkfs.ext4 -j /dev/mapper/${VOLUME}
#create mount location
mkdir /mnt/${MOUNT}
#mount it
mount /dev/mapper/${VOLUME} /mnt/${MOUNT}

#every time check
#on open

#on close
#umount /mnt/${MOUNT}
#cryptsetup luksClose ${VOLUME}

#
#dd if=/dev/zero of=${DEVICE} bs=1M count=1024
#cat <<EOF | fdisk ${DEVICE}
#g
#n
#
#
#w
#EOF
#
#mkfs.ext4 ${DEVICE}
#
#losetup ${LOOP} ./${DEVICE}
##losetup -Pf --show ${DEVICE}
#
#apt-get install cryptsetup
#
#echo -n "otnode" | cryptsetup luksFormat ${LOOP}
#
#cat <<EOF | cryptsetup luksOpen ${LOOP} ${MOUNT}
#otnode
#EOF
#
#dd if=/dev/zero of=/dev/mapper/${MOUNT}
#
#mkfs.ext4 /dev/mapper/${MOUNT}
#
#mkdir /${MOUNT}
#
#mount /dev/mapper/${MOUNT} /${MOUNT}
#
#df -H


# ----

# docker run -ti --name test fedora:25 /bin/bash
# echo 512 > /proc/sys/net/core/somaxconn   # in docker
# bash: /proc/sys/net/core/somaxconn: Read-only file system
# exit # exit docker, back to host
# systemctl stop docker # or stop it with whatever servicemanager you're using

# cd /var/lib/docker/containers/b48fcbce0ab29749160e5677e3e9fe07cc704b47e84f7978fa74584f6d9d3c40/
# cp hostconfig.json{,.bak}
# cat hostconfig.json.bak | jq '.Privileged=true' | jq '.SecurityOpt=["label=disable"]' > hostconfig.json

# systemctl start docker
# docker start test
# test
# docker exec -ti test /bin/bash
# echo 512 > /proc/sys/net/core/somaxconn   # in docker, now works


# ----

# 1. start in privileged mode
# 2. run luks script
# 3. run migration
# 	a. move data/
# 	b. change supervisord data path
# 	c. move arangodb
# 		i. nano /etc/arangodb3/arangod.conf
# 		ii. /var/lib/arangodb3
# 		iii. chmod 700

# ** script should check if luks device is mounted
# ** when luks password expires and when it should be changed