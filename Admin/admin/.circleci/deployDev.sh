#!/bin/bash

ssh -o StrictHostKeyChecking=no ${uname}@${ip} << EOF

echo "1. pull code from bitbucket......"
cd ${stagingPath}
sudo su
git checkout --force  mandobiMaster
git reset --hard
git clean -fd
git pull
chmod -R 777 ./*
echo '----------------------------------Done!----------------------------------'
EOF