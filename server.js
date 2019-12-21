var io = require('socket.io')(3000);
var shortId = require('shortid');
var gp = require('./classes/GameProperty.js');
// var dbCon = require('./dbControl.js');
var qaControl = require('./classes/QuestionController.js');

var objPlayers = {};
var gameDatas = {};
var objQuestions = {};

// dbCon.Select("SELECT * FROM tblQA", function(result){ 
// 	if(result.length > 0){
// 		for(var i = 0; i < result.length; i++){
//             let res = result[i];
//             qaControl.AddQuestion(res['question'],res['answer'],res['choice1'],res['choice2'],res['choice3'],res['difficulty']);
//         }
//     }
//     // console.log("quest = " + qaControl.GetQuestion()["question"] + " answer = " + qaControl.GetQuestion().answer);
// });
for(var i = 0; i < 40; i++){
    qaControl.AddQuestion("Is this a hard Question with Number " + i,"Correct Answer " + i,"Wrong Answer 1","Wrong Answer 2","Wrong Answer 3","1");
}

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
            socket.emit('OnFindingMatch',{message:"Finding Match"});
            objPlayers[socket.id].status = gp.PlayerStatus.findMatch;
            for(var sid in objPlayers){ //loop through all find match player
				if(objPlayers[sid].status == gp.PlayerStatus.findMatch && sid != socket.id){// && IsMmrMatch(plMmr,objPlayers[sid].mmr,(findRange * 150))){ disable mmr for test
					SetDetailMatchFound(socket.id,sid);
				}
			}
        }
    });

    function SetDetailMatchFound(curSid,othSid){
		var roomId = shortId.generate();
		objPlayers[othSid].roomId = roomId;
		objPlayers[othSid].status = gp.PlayerStatus.matchPending;
		objPlayers[curSid].roomId = roomId;
		objPlayers[curSid].status = gp.PlayerStatus.matchPending;
		socket.broadcast.to(othSid).emit("OnMatchFound", {'roomId': roomId});
		// socket.broadcast.to(othSid).emit("OnPlayerInformation", PlayerInformation(curSid)); //currentplayer info to opponent
		socket.emit("OnMatchFound", {'roomId': roomId});
		// socket.emit("OnPlayerInformation", PlayerInformation(othSid)); //opponent info to currentplayer
        var p = {};
        var initPlayer = {status:gp.PlayerStatus.inGame, score:0,answers:[]};
		p[objPlayers[othSid].playerId] = initPlayer;
		p[objPlayers[curSid].playerId] = initPlayer;
		gameDatas[roomId] = {
            gameStatus: 0,
			players: p
		}
    }

    socket.on('StartGame',function(){ // both player ping start game
		var sid = socket.id;
		var roomId = objPlayers[sid].roomId;
		socket.join(roomId);
		var status = gameDatas[roomId].gameStatus;
		objPlayers[sid].status = gp.PlayerStatus.inGame;
        gameDatas[roomId].gameStatus = status + 1;
		if(gameDatas[roomId].gameStatus == 2){
            objQuestions[roomId] = {questionsIndex: qaControl.GenerateQuestionsIndex()};
            var data = {};
            data.gameStatus = gp.PlayerStatus.running;
            data.round = 1;
            var qa = qaControl.GetQuestion(objQuestions[roomId].questionsIndex[data.round - 1]);
            data.question = qa.question;
            data.answers = [];
            var nums = [0,1,2,3];
            for(var i = 0; i < 4; i++){
                j = Math.floor(Math.random() * nums.length);
                data.answers.push(qa.answers[nums[j]]);
                if(nums[j] == 0){ // answers index 0 is correct answer; 
                    data.correctIndex = i;
                }
                nums.splice(j,1);
            }
            data.players = gameDatas[roomId].players;
            gameDatas[roomId] = data;
			// var getplayerIds = GetplayerIdFromObject(gameDatas[roomId].players);
			// for(var i = 0; i < 2; i++){
			// 	dbCon.Update("Update tblplayer set gameID = '"+roomId+"' where id = '" + getplayerIds[i] +"'");
			// 	gameDatas[roomId].players[getplayerIds[i]].gameplay = CreateBoard(i);
			// 	gameDatas[roomId].players[getplayerIds[i]].status = gp.PlayerStatus.inGame;
			// }
			// gameDatas[roomId].whoTurn = getplayerIds[0];
			// gameDatas[roomId].lastUpdate = Date.now();
			io.to(roomId).emit('OnGameStarted',gameDatas[roomId]);
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
    
    // function GetplayerIdFromObject(players){
	// 	var tempID = [];
	// 	for(var ids in players){
	// 		tempID.push(ids);
	// 	}
	// 	return tempID;
	// }
});


// var data = {};

// var qqa = [];
// qqa = qaControl.GenerateQuestionsIndex();
//             data.gameStatus = gp.PlayerStatus.running;
//             data.round = 1;
//             var qa = qaControl.GetQuestion(qqa[data.round - 1]);
//             data.question = qa.question;
//             data.answers = [];
//             var nums = [0,1,2,3];
//             // ranChoice = [];
//             for(var i = 0; i < 4; i++){
//                 j = Math.floor(Math.random() * nums.length);
//                 // ranChoice.push(nums[j]);
//                 data.answers.push(qa.answers[nums[j]]);
//                 if(nums[j] == 0){
//                     data.correctIndex = i;
//                 }
//                 nums.splice(j,1);
//             }
            
//             console.log(JSON.stringify(data));

// p[123] = {status:gp.PlayerStatus.inGame};
// p[321] = {status:gp.PlayerStatus.inGame};
// gameDatas[222] = {
//     players: p
// }
// var data = {};
// data.players = gameDatas[222].players;
// data.status = "asfds";

// var arr = ['1','12'];
// var rao = "sadf";
// objQuestions[rao] = {
//     asw: arr
// };

// objQuestions[123].questionsIndex = arr;



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