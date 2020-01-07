# superquizbattle

## Todo
- catch the same id in game exception
- Database
- Track answer

## Game Algorithm
- Score = 100 + (remain millisecond / 100), ex: remain 10 seconds for time end, score = 200, => 100 + (10000/ 100);

## Framework Used
- Jenkins and Github for continue integration
- pm2 for Controlling NodeJS process.
    - pm2 start filename.js --name "setname" : --name "setname" for specific application will easy to restart or stop
    - pm2 stop/restart "setname" 
    * if start pm2 error : "let val = process.env[key];" then need to udpate node 
    * if we start pm2 from terminal, it can't stop from jenkins. cause by diffenrent user. 

- install NodeJS version Cmd:
    - curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    - sudo apt-get install -y nodejs

## Error Message
listen EADDRINUSE: address already in use :::3000
    - lsof -i:3000 // check for actived port
    - kill -9 PID // Kill that process
