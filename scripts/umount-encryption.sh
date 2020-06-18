#!/bin/bash

DEVICE=encryptedfs.img
VOLUME=evolume
MOUNT=ot-node-encrypted

#unmount the filesystem
umount /mnt/${MOUNT}
##close the volume
cryptsetup luksClose ${VOLUME}