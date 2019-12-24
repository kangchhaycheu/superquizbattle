var io = require('socket.io')(3000);
var shortId = require('shortid');
var gp = require('./classes/GameProperty.js');
// var dbCon = require('./dbControl.js');
var qaControl = require('./classes/QuestionController.js');

var objPlayers = {};
var gameDatas = {};
var pvpQuestionsControl = {};
var answerTimer = {};
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
        if(IsPlayerExisted(socket.id)){
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
		socket.broadcast.to(othSid).emit("OnMatchFound", {'roomId': roomId,'opponentInfo':PlayerInformation(curSid)});
		// socket.broadcast.to(othSid).emit("OnPlayerInformation", PlayerInformation(curSid)); //currentplayer info to opponent
		socket.emit("OnMatchFound", {'roomId': roomId, 'opponentInfo':PlayerInformation(othSid)});
		// socket.emit("OnPlayerInformation", PlayerInformation(othSid)); //opponent info to currentplayer
        var p = {};
        var initPlayer = {status:gp.PlayerStatus.inGame, score:0,answers:[]};
		p[objPlayers[othSid].playerId] = JSON.parse(JSON.stringify(initPlayer)); // not reference
		p[objPlayers[curSid].playerId] = JSON.parse(JSON.stringify(initPlayer));
		gameDatas[roomId] = {
            gameStatus: 0,
			players: p
        }
    }
    function PlayerInformation(sid){
		var pl = {
            playerId : objPlayers[sid].playerId,
            name : objPlayers[sid].playerName
        };
        console.log(JSON.stringify(pl));
		return pl;
	}

    socket.on('StartGame',function(){ // both player ping start game
        if(IsPlayerExisted(socket.id)){
            var sid = socket.id;
            var roomId = objPlayers[sid].roomId;
            socket.join(roomId);
            var status = gameDatas[roomId].gameStatus;
            objPlayers[sid].status = gp.PlayerStatus.inGame;
            gameDatas[roomId].gameStatus = status + 1;
            if(gameDatas[roomId].gameStatus == 2){
                pvpQuestionsControl[roomId] = {questionsIndex: qaControl.GenerateQuestionsIndex()};
                gameDatas[roomId] = GetGameData(1, roomId, gameDatas[roomId].players);
                io.to(roomId).emit('OnGameStarted',gameDatas[roomId]);
                answerTimer[roomId] = {
                    timer:setTimeout(() => {
                        SetAnswerTimer(roomId);
                    }, 10000)
                };
            }
        }
    });
    
    function GetGameData(round,roomId,players){
        let data = {};
        data.gameStatus = gp.PlayerStatus.running;
        data.round = round;
        let qa = qaControl.GetQuestion(pvpQuestionsControl[roomId].questionsIndex[data.round - 1]);
        data.question = qa.question;
        data.answers = [];
        let nums = [0,1,2,3];
        for(let i = 0; i < 4; i++){
            j = Math.floor(Math.random() * nums.length);
            data.answers.push(qa.answers[nums[j]]);
            if(nums[j] == 0){ // answers index 0 is correct answer; 
                data.correctIndex = i;
            }
            nums.splice(j,1);
        }
        data.players = players;
        return data;
    }
    function SetAnswerTimer(roomId){
        let gd = gameDatas[roomId];
        let round = gd.round; 
        let playersId = gp.GetPlayerIdFromObject(gd.players);
        for(let i = 0; i < 2; i++){
            if(gd.players[playersId[i]].answers.length == round - 1){
                gd.players[playersId[i]].answers.push(0);
                let json = {playerId: playersId[i], round:round,answerIndex:-1, score:gd.players[playersId[i]].score};
                io.to(roomId).emit('OnGameAnswer',json);
            }
        }
        if(round == 10){
            io.to(roomId).emit('OnGameFinished',gameDatas[roomId]);
            delete gameDatas[roomId];
            delete pvpQuestionsControl[roomId];
        }else{ // move next
            setTimeout(function(){
                gameDatas[roomId] = GetGameData(round + 1, roomId, gameDatas[roomId].players);
                io.to(roomId).emit('OnGameNextQuestion',gameDatas[roomId]);
                answerTimer[roomId] = {
                    timer:setTimeout(() => {
                        SetAnswerTimer(roomId);
                    }, 11000)
                };
            },1 * 1000);
        }
    }

    socket.on ('GameAnswer',function(data){
        if(!IsPlayerExisted(socket.id)){
            return;
        }
        let pl = objPlayers[socket.id];
        if(pl == null) return;
        gd = gameDatas[pl.roomId];
        if(gd == null) return; 
        let round = gd.round; 
        if(gd.players[pl.playerId].answers.length == round - 1){
            if(data['answerIndex'] == gd.correctIndex){ //correc Answer
                gd.players[pl.playerId].answers.push(1);
                gd.players[pl.playerId].score += 10;
            }else{
                gd.players[pl.playerId].answers.push(0);
            }
        }else if(gd.players[pl.playerId].answers.length == round){ // player round different from game round
            socket.emit('OnGameAnswer', {failed: "answered"});
            return;
        }else{ //through exception

        }
        let oppId = gp.GetOpponentId(gd.players,pl.playerId);
        if(gd.players[oppId].status == gp.PlayerStatus.disconnected){
            if(gd.players[oppId].answers.length == round - 1){
                gd.players[oppId].answers.push(0);
            }
        }
        // gameDatas[pl.roomId] = gd;
        let json = {playerId: pl.playerId, round:round,answerIndex:data['answerIndex'], score:gd.players[pl.playerId].score};
        io.to(pl.roomId).emit('OnGameAnswer',json);
        let index = gp.GetPlayerIdFromObject(gd.players);
        if(gd.players[index[0]].answers.length == gd.players[index[1]].answers.length){
            clearTimeout(answerTimer[pl.roomId].timer);
            if(round == 10){ //finished
                //clear game data
                io.to(pl.roomId).emit('OnGameFinished',gameDatas[pl.roomId]);
                delete gameDatas[pl.roomId];
                delete pvpQuestionsControl[pl.roomId];
            }else{ // move next
                setTimeout(function(){
                    gameDatas[pl.roomId] = GetGameData(round + 1, pl.roomId, gameDatas[pl.roomId].players);
                    io.to(pl.roomId).emit('OnGameNextQuestion',gameDatas[pl.roomId]);
                    answerTimer[pl.roomId] = {
                        timer:setTimeout(() => {
                            SetAnswerTimer(pl.roomId);
                        }, 11000)
                    };
                },1 * 1000);
            }
        }
    });
 
    socket.on('CancelMatchFinding',function (){
		if(IsPlayerExisted(socket.id)){
			if(objPlayers[socket.id].status == gp.PlayerStatus.findMatch){
				objPlayers[socket.id].status = gp.PlayerStatus.home;
				socket.emit('OnCanceledMatchFinding',{});
			}
		}
	});

    socket.on('Lobby',function(){
        if(IsPlayerExisted(socket.id)){
            objPlayers[socket.id].status = gp.PlayerStatus.home;
            socket.emit('OnLobby',objPlayers[socket.id]);
        }
    });

    socket.on('disconnect', function (){
		if(IsPlayerExisted(socket.id)){
			var pl = objPlayers[socket.id];
			var gd = gameDatas[pl.roomId];
			if(pl.status == gp.PlayerStatus.inGame){ // disconnect while in game
                if(gd != null){ //game still in process
                    gd.players[pl.playerId].status = gp.PlayerStatus.disconnected;
                    if(gd.players[gp.GetOpponentId(gd.players,pl.playerId)].status == gp.PlayerStatus.disconnected){ // both player disconnected
                        delete gameDatas[pl.roomId];
                        delete pvpQuestionsControl[pl.roomId]; 
                    }else{
                        io.to(pl.roomId).emit('OnOpponentDisconnected',{id:pl.playerId}); // send to another player except disconnector
                    }
				}
			}
            console.log("Disconnected Id = " + objPlayers[socket.id].playerId);
            delete objPlayers[socket.id];
		}
    });

    function IsPlayerExisted(sid){
		if(objPlayers[sid] != null){
			return true;
		}else{
			socket.emit("OnPlayerException",{});
        }
        return false;
	}    
});


// var aa = {
//     name : "adsfasf",
//     playerId : "123"
// };
// console.log(JSON.stringify(aa));
//catch all exception send to client
//clear qaObject when game finish
//game duration
//

// let da = "123132";
// function timers(cd){
//     console.log(cd);
// }
// let var1  = setTimeout(function(){ 
//     timers(da);
//     // console.log("Hello 1"); 
// }, 1000);
// let var2 = setTimeout(function(){ console.log("Hello 2"); }, 2000);
// let var3 = setTimeout(function(){ console.log("Hello 3"); }, 3000);
// var times = {
//     can :[var1,var2,var3]
// };

// clearTimeout(times.can[2]);



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