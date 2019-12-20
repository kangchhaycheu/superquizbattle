var io = require('socket.io')(3000);
var shortId = require('shortid');
// var dbCon = require('./dbControl.js');
// var qaControl = require('./classes/QuestionController.js');

var objPlayers = {};
var gameDatas = {};

// dbCon.Select("SELECT * FROM tblQA", function(result){ 
// 	if(result.length > 0){
// 		for(var i = 0; i < result.length; i++){
//             let res = result[i];
//             qaControl.AddQuestion(res['question'],res['answer'],res['choice1'],res['choice2'],res['choice3'],res['difficulty']);
//         }
//     }
//     // console.log("quest = " + qaControl.GetQuestion()["question"] + " answer = " + qaControl.GetQuestion().answer);
// });


io.on('connection', function (socket) {
    socket.on('PlayerLogin',function(data){
        PlayerLogin(data['playerId']);
    });
    function PlayerLogin(playerId){
        var currentPlayer = {};
        currentPlayer.playerId = playerId;
        currentPlayer.playerName = "Guest " + playerId;
        currentPlayer.status = "Home";
        socket.emit('OnLobby', currentPlayer);
    }

    socket.on('Lobby',function(){
		// objPlayers[socket.id].status = enumAllStatus.home;
		// socket.emit('OnLobby',objPlayers[socket.id]);
	});
});



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
