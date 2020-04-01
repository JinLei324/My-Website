#!/bin/bash

chmod 400 ./key.pem
ssh -i ./key.pem ${uname}@${ip} << EOF
echo '1. Updating sources'
sudo su
cd ${path}
echo ${path}
git checkout --force GrocerAdmin2.0_Pramod_Dev
git reset --hard HEAD
git pull

#echo "2. Restart nginx"
#sudo systemctl nginx reload
#echo 'Done!'
EOF
