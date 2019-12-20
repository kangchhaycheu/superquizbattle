var io = require('socket.io')(3000);
var shortId = require('shortid');
var gp = require('./classes/GameProperty.js');
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
        currentPlayer.status = gp.PlayerStatus.home;
        objPlayers[socket.id] = currentPlayer;
        socket.emit('OnLobby', currentPlayer);
    }

    socket.on('FindMatch', function(data){
        if(objPlayers[socket.id] != null){
            for(var sid in objPlayers){ //loop through all find match player
				if(objPlayers[sid].status == gp.PlayerStatus.findMatch && sid != socket.id){// && IsMmrMatch(plMmr,objPlayers[sid].mmr,(findRange * 150))){ disable mmr for test
					SetDetailMatchFound(socket.id,sid,gDuration,"OnMatchFound");
				}
			}
        }
    });

    function SetDetailMatchFound(curSid,othSid){
		var roomID = shortId.generate();
		objPlayers[othSid].roomID = roomID;
		objPlayers[othSid].status = gp.PlayerStatus.matchPending;
		objPlayers[curSid].roomID = roomID;
		objPlayers[curSid].status = gp.PlayerStatus.matchPending;
		socket.broadcast.to(othSid).emit("OnMatchFound", {'roomid': roomID});
		socket.broadcast.to(othSid).emit("OnPlayerInformation", PlayerInformation(curSid)); //currentplayer info to opponent
		socket.emit("OnMatchFound", {'roomid': roomID});
		socket.emit("OnPlayerInformation", PlayerInformation(othSid)); //opponent info to currentplayer
		var p = {};
		p[objPlayers[othSid].playerID] = {status:gp.PlayerStatus.inGame};
		p[objPlayers[curSid].playerID] = {status:gp.PlayerStatus.inGame};
		gameDatas[roomID] = {
			gameStatus: 0,
			players: p
		}
    }

    socket.on('StartGame',function(){ // both player ping start game
		var sid = socket.id;
		var roomID = objPlayers[sid].roomID;
		socket.join(roomID);
		var status = gameDatas[roomID].gameStatus;
		objPlayers[sid].status = gp.PlayerStatus.inGame;
		gameDatas[roomID].gameStatus = status + 1;
		if(gameDatas[roomID].gameStatus == 2){
			gameDatas[roomID].gameStatus = gp.PlayerStatus.running;
			// var getPlayerIDs = GetPlayerIDFromObject(gameDatas[roomID].players);
			// for(var i = 0; i < 2; i++){
			// 	dbCon.Update("Update tblplayer set gameID = '"+roomID+"' where id = '" + getPlayerIDs[i] +"'");
			// 	gameDatas[roomID].players[getPlayerIDs[i]].gameplay = CreateBoard(i);
			// 	gameDatas[roomID].players[getPlayerIDs[i]].status = gp.PlayerStatus.inGame;
			// }
			// gameDatas[roomID].whoTurn = getPlayerIDs[0];
			// gameDatas[roomID].lastUpdate = Date.now();
			io.to(roomID).emit('OnGameStarted',gameDatas[roomID]);
		}
	});
    
    socket.on('CancelFinding',function (){
		if(objPlayers[socket.id] != null){
			if(objPlayers[socket.id].status == gp.PlayerStatus.findMatch){
				objPlayers[socket.id].status = gp.PlayerStatus.home;
				socket.emit('OnCanceledFinding',{});
			}
		}
	});

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