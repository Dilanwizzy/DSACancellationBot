#!/bin/bash

echo "environment name: $NODE_ENV"
echo "wait for DB to start"
sleep 5
echo "DB host: $DB_HOST"
echo "running DB migration scripts (yarn)"
yarn migration:create latest
yarn migration:generate latest
echo "starting X server and VNC display"
touch ~/.Xauthority
Xvfb :1 -screen 0 1024x768x24 &
/usr/bin/x11vnc -display :1.0 -usepw -quiet &
DISPLAY=:1.0
export DISPLAY
echo "starting node server"
yarn start:prod