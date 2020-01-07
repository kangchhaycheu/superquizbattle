var io = require('socket.io')(3000);
var shortId = require('shortid');

var gp = require('./classes/GameProperty.js');
var dbCon = require('./dbControl.js');
var player = require('./classes/PlayerController.js');
var qaControl = require('./classes/QuestionController.js');
var game = require('./classes/GameController.js');



let categoryId = 0; 
for(var i = 0; i < 40; i++){
    qaControl.AddQuestion(i,"Is this a hard Question with Number " + i,"Correct Answer " + i,"Wrong Answer 1","Wrong Answer 2","Wrong Answer 3",categoryId,"1");
    if(i % 5 == 0){
        categoryId ++;
    }
}
// dbCon.Select("SELECT * FROM tblQA", function(result){ 
// 	if(result.length > 0){
// 		for(var i = 0; i < result.length; i++){
//             let res = result[i];
//             qaControl.AddQuestion(res['question'],res['answer'],res['choice1'],res['choice2'],res['choice3'],res['difficulty']);
//      }
//  }
//     // console.log("quest = " + qaControl.GetQuestion()["question"] + " answer = " + qaControl.GetQuestion().answer);
// });


game.InstantIO(io);
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
        player.CancelMatchFinding(socekt);
	});

    socket.on('Lobby',function(){
        player.Lobby(socekt);
    });

    socket.on('StartGame',function(){ //both player ping start game
        game.PingStartGame(socket);
    });
    
    socket.on ('GameAnswer',function(data){
        game.GameAnswer(socket,data);
    });

    socket.on('disconnect', function (){
        player.Disconnected(socket);
    });
    // function GetDateTime(){
    //     // return Math.floor(Date.now()/1000);
    //     return Date.now(); //return as milisecond utc (1970)
    // }
});

//catch if player has the same id
//catch all exception send to client
//clear qaObject when game finish
//game duration

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


// var gp.objPlayers = {};
// var gameDatas = {};
// var pvpQuestionsControl = {};
// var answerTimer = {};
// let questionDuration = 10000; 



    // function PlayerLogin(playerId){
    //     var currentPlayer = {};
    //     currentPlayer.playerId = playerId;
    //     currentPlayer.playerName = "Guest " + playerId;
    //     currentPlayer.status = gp.PlayerStatus.home;
    //     socket.emit('OnLobby', currentPlayer);
    //     currentPlayer.roomId = "-1";
    //     gp.objPlayers[socket.id] = currentPlayer;
    // }

        // function PlayerInformation(sid){
	// 	var pl = {
    //         playerId : gp.objPlayers[sid].playerId,
    //         name : gp.objPlayers[sid].playerName
    //     };
	// 	return pl;
    // }
    
    // function IsGameCondition(){
    //     if(gp.IsPlayerExisted(socket)){
    //         let roomId = gp.objPlayers[socket.id].roomId;
    //         if(gp.IsRoomId(socket, roomId)){
    //             if(gp.IsGameData(socket, roomId)){
    //                 return true;
    //             }
    //         }
    //     }
    //     return false;
    // }
    // function IsPlayerExisted(sid){
	// 	if(gp.objPlayers[sid] == null){
    //         socket.emit("OnPlayerException",{});
	// 		return false;
	// 	}
    //     return true;
    // }   
    // function IsGameData(roomId){
    //     if(gameDatas[roomId] == null){
    //         socket.emit("OnPlayerException",{});
    //         return false;
    //     }
    //     return true;
    // } 
    // function IsRoomId(roomId){
    //     if(roomId == "-1"){
    //         socket.emit("OnPlayerException",{});
    //         return false;
    //     }
    //     return true;
    // }

        // function EmitGameFinish(roomId){
    //     let ids = gp.GetPlayerIdFromObject(gameDatas[roomId].players);
    //     let winner = "gameDraw";
    //     if(gameDatas[roomId].players[ids[0]].score > gameDatas[roomId].players[ids[1]].score){
    //         winner = ids[0];
    //     }else if(gameDatas[roomId].players[ids[0]].score < gameDatas[roomId].players[ids[1]].score){
    //         winner = ids[1];
    //     }
    //     let js = {
    //         winner: winner,
    //         players: gameDatas[roomId].players
    //     };
    //     io.to(roomId).emit('OnGameFinished',js);
    //     delete gameDatas[roomId];
    //     delete pvpQuestionsControl[roomId];
    // }
    // function GetGameData(round,roomId,players){
    //     let data = {};
    //     data.gameStatus = gp.PlayerStatus.running;
    //     data.round = round;
    //     let qa = qaControl.GetQuestion(pvpQuestionsControl[roomId].questionsIndex[data.round - 1]);
    //     data.question = qa.question;
    //     data.timeEnd = '' + (Date.now() + questionDuration);// Math.floor((Date.now() + questionDuration) /1000);
    //     data.answers = [];
    //     let nums = [0,1,2,3];
    //     for(let i = 0; i < 4; i++){
    //         j = Math.floor(Math.random() * nums.length);
    //         data.answers.push(qa.answers[nums[j]]);
    //         if(nums[j] == 0){ // answers index 0 is correct answer; 
    //             data.correctIndex = i;
    //         }
    //         nums.splice(j,1);
    //     }
    //     data.players = players;
    //     return data;
    // }
    // function SetAnswerTimer(roomId){
    //     let gd = gameDatas[roomId];
    //     if(gd == null){
    //         return;
    //     }
    //     let round = gd.round; 
    //     let playersId = gp.GetPlayerIdFromObject(gd.players);
    //     for(let i = 0; i < 2; i++){
    //         if(gd.players[playersId[i]].answers.length == round - 1){
    //             gd.players[playersId[i]].answers.push(0);
    //             let json = {playerId: playersId[i], round:round,answerIndex:-1, score:gd.players[playersId[i]].score};
    //             io.to(roomId).emit('OnGameAnswer',json);
    //         }
    //     }
    //     if(round == 10){
    //         EmitGameFinish(roomId);
    //     }else{ // move next
    //         setTimeout(function(){
    //             gameDatas[roomId] = GetGameData(round + 1, roomId, gameDatas[roomId].players);
    //             io.to(roomId).emit('OnGameNextQuestion',gameDatas[roomId]);
    //             answerTimer[roomId] = {
    //                 timer:setTimeout(() => {
    //                     SetAnswerTimer(roomId);
    //                 }, questionDuration)
    //             };
    //         },1 * 1000);
    //     }
    // }
