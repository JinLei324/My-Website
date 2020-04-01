#!/bin/bash

ssh -o StrictHostKeyChecking=no ${uname}@${ip} << EOF
echo "1. pull code from bitbucket......"
cd ${path}
sudo su
git reset --hard
git clean -fd
git checkout --force production
git pull
sudo npm install
chmod -R 777 ../api/
echo "2. Restart node server......"
sudo forever stop mainServer.js
sudo forever start mainServer.js
echo '----------------------------------Done!----------------------------------'

EOF
