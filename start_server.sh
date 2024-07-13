#!/bin/bash

cd /root/bda/main/python_server && nohup python3 main.py > server_python.log 2>&1 &
cd /root/bda/main && nohup npm start > npm.log 2>&1 &

# 현재 세션에서 분리
disown -a
