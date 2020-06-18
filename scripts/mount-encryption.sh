#!/bin/bash

DEVICE=encryptedfs.img
VOLUME=evolume
MOUNT=ot-node-encrypted

cryptsetup luksOpen /root/${DEVICE} ${VOLUME}
mount /dev/mapper/${VOLUME} /mnt/${MOUNT}