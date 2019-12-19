# superquizbattle


## Framework Used
- Jenkins and Github for continue integration
- pm2 for Controlling NodeJS process.
    - pm2 start filename.js --name "setname" : --name "setname" for specific application will easy to restart or stop
    - pm2 stop/restart "setname" 
    * if start pm2 error : "let val = process.env[key];" then need to udpate node 
- install NodeJS version Cmd:
    - curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    - sudo apt-get install -y nodejs
    