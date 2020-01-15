var io = require('socket.io')(3000);
var shortId = require('shortid');
var moment = require('moment');

// var gp = require('./classes/GameProperty.js');
var dbCon = require('./dbControl.js');
var player = require('./classes/PlayerController.js');
var qaControl = require('./classes/QuestionController.js');
var game = require('./classes/GameController.js');
var lc = require('./classes/LeaderboardControl.js');

let subjectId = 1; 
for(var i = 0; i < 40; i++){
    qaControl.AddQuestion(i,"Is this a hard Question with Number " + i,"Correct Answer " + i,"Wrong Answer 1","Wrong Answer 2","Wrong Answer 3",subjectId,"1");
    if(i % 5 == 0 && i != 0){
        subjectId ++;
    }
}

dbCon.Select("Select * From tblSubject", function(result){
    if(result.length > 0){
        for(let i = 0; i < result.length; i++){
            let res = result[i];
            qaControl.AddSubject(res['id'],res['subject']);
        }
    }
});

// let aa = new leaderboard(dbCon);
// aa.SubmitScore("0001",12);

// dbCon.Select("SELECT * FROM tblQA", function(result){ 
// 	if(result.length > 0){
// 		for(var i = 0; i < result.length; i++){
//             let res = result[i];
//             qaControl.AddQuestion(res['question'],res['answer'],res['choice1'],res['choice2'],res['choice3'],res['difficulty']);
//      }
//  }
//     // console.log("quest = " + qaControl.GetQuestion()["question"] + " answer = " + qaControl.GetQuestion().answer);
// });

game.InstantObject(io,dbCon,lc);
player.InstantObject(io,dbCon,qaControl);
lc.InstantObject(dbCon,moment);

io.on('connection', function (socket) {
    socket.on('PlayerLogin',function(data){
        player.Login(socket,data);
    });

    socket.on('ServerTime', function (){
        socket.emit('OnServerTime', {dateTime:''+Date.now()});
    });

    socket.on('FindMatch', function(data){
        player.FindMatch(socket);
    });

    socket.on('CancelMatchFinding',function (){
        player.CancelMatchFinding(socket);
	});

    socket.on('Lobby',function(){
        player.Lobby(socket);
    });

    socket.on('StartGame',function(){ //both player ping start game
        game.PingStartGame(socket);
    });
    
    socket.on ('GameAnswer',function(data){
        game.GameAnswer(socket,data);
    });
    
    socket.on ('PlayerHistory',function(data){
        player.PlayerHistory(socket);
    });

    socket.on('Leaderboard',function(){
       
    });

    socket.on('disconnect', function (){
        player.Disconnected(socket);
    });
    // function GetDateTime(){
    //     // return Math.floor(Date.now()/1000);
    //     return Date.now(); //return as milisecond utc (1970)
    // }
});


// let ww = moment().isoWeekYear() + ""+ moment().isoWeek();
// console.log(ww);
lc.GetWeeklyLeaderboard();
// console.log(nextWeekDate.diff(moment()));
//catch if player has the same id
//catch all exception send to client
//clear qaObject when game finish
//game duration

// console.log("w = " + moment("2020-W01-1").toDate());
// console.log("w = " + moment().isoWeekday(2).toDate());
// console.log("w = " + moment("2020-01-01", "YYYY-MM-DD").isoWeekday(3).toDate());

// let startDate = moment({hour:09,minute:00,second:00}).isoWeekday(1);
// let endDate = moment({hour:10,minute:01,second:00}).isoWeekday(2);
// // console.log(startDate.toString());
// let rsnd = endDate.diff(moment());

// console.log(moment(rsnd).format('D[ day(s)] H[ hour(s)] m[ minute(s)] s[ second(s) ago.]'));
// console.log(rsnd);

// setInterval(function() { loop
//     let rsnd = endDate.diff(moment());
//     console.log(rsnd);
// }, 1000);
// console.log(moment().isoWeek());
// console.log(moment("2021-01-01", "YYYY-MM-DD").isoWeekYear());


// $now = new DateTime(date("Y-m-d H:i:s"));
// $weekNumber = $now->format("W"); // W = week number of the year, and start from monday
// $year = $now->format("o"); // Y = year 2019
// $startDate = new DateTime(date("l, M jS, Y", strtotime($year."W".$weekNumber."1")));
// $startDate->add(new DateInterval('PT9H0M0S'))->format('Y-m-d H:i:s');
// $endDate = new DateTime(date("l, M jS, Y", strtotime($year."W".$weekNumber."6"))); //result = Sunday, Sep 1st, 2019 (current date = tue Aug 27, 2019). 7 stand for sunday
// $endDate->add(new DateInterval('PT21H0M0S'))->format('Y-m-d H:i:s'); //added 21 hour let end = 9pm. timespan format = 'P' = Date , T = time 'ex: P7Y5M4DT4H3M2S, PT = date is null';

// $remindSecond = $endDate->getTimestamp() - $now->getTimestamp(); //return total seconds. //print_r( $remindSecond);
// $result->weekID = $year."".$weekNumber;
// if($startDate > $now){ // event not yet start
//     $result->eventCode = 2;
//     $result->remindSeconds = $startDate->getTimestamp() - $now->getTimestamp();
// }else{
//     if($remindSecond > 0){ // during event
//         $result->eventCode = 1;
//         $result->remindSeconds = $remindSecond;
//     }else{ // event ended
//         $result->eventCode = 3;
//         $startDate->add(new DateInterval('P0Y0M7D'));
//         $result->remindSeconds = $startDate->getTimestamp() - $now->getTimestamp();

//     }
// }
// if($result->eventCode == 3){
//     $result->lastWeekID = $result->weekID;
// }else{
//     $subtW = $now->modify("-7 day");
//     $lw = $subtW->format("W");
//     $ly = $subtW->format("o");
//     $result->lastWeekID = $ly."".$lw;
// }

//these still not work yet.
process.on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  })
  .on('SIGTERM', err =>{
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  }) ;
console.log("------- server is running -------");