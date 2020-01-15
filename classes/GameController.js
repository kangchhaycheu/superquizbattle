var gp = require('./GameProperty.js');
var qaControl = require('./QuestionController.js');

class GameController{
    constructor(){
        this.pvpQuestionsControl = {};
        this.questionDuration = 10000; 
        this.answerTimer = {};
    }
    InstantObject(io,dbCon,leaderboard){
        cls.io = io;
        cls.dbCon = dbCon;
        cls.lc = leaderboard;
    }
    InitGame(curSid, othSid, roomId){ // called in playerControll match found
        var p = {};
        var initPlayer = {status:gp.PlayerStatus.inGame, score:0,answers:[]};
		p[gp.objPlayers[othSid].playerId] = JSON.parse(JSON.stringify(initPlayer)); // not reference
		p[gp.objPlayers[curSid].playerId] = JSON.parse(JSON.stringify(initPlayer));
		gp.gameDatas[roomId] = {
            gameStatus: 0,
			players: p
        }
        cls.answerTimer[roomId] = {
            timer:setTimeout(() => {
                cls.io.to(roomId).emit('OnGameFailedToStart',{});
                if(gp.gameDatas[roomId] != null){
                    delete gp.gameDatas[roomId];
                }
            },20000)//wait 20sec
        };
    }
    PingStartGame(socket){ //both player ping start game
        if(!cls.IsGameCondition(socket)){
            return;
        }
        var sid = socket.id;
        var roomId = gp.objPlayers[sid].roomId;
        socket.join(roomId);
        var status = gp.gameDatas[roomId].gameStatus;
        gp.objPlayers[sid].status = gp.PlayerStatus.inGame;
        gp.gameDatas[roomId].gameStatus = status + 1;
        if(gp.gameDatas[roomId].gameStatus == 2){
            clearTimeout(cls.answerTimer[roomId].timer);
            cls.pvpQuestionsControl[roomId] = {questionsIndex: qaControl.GenerateQuestionsIndex()};
            gp.gameDatas[roomId] = cls.GetGameData(1, roomId, gp.gameDatas[roomId].players);
            cls.io.to(roomId).emit('OnGameStarted',gp.gameDatas[roomId]);
            cls.answerTimer[roomId] = {
                timer:setTimeout(() => {
                    SetAnswerTimer(roomId);
                },cls.questionDuration)
            };
        }
    }
    GetGameData(round,roomId,players){
        let data = {};
        data.gameStatus = gp.PlayerStatus.running;
        data.round = round;
        let qa = qaControl.GetQuestion(cls.pvpQuestionsControl[roomId].questionsIndex[data.round - 1]);
        data.question = qa.question;
        data.timeEnd = '' + (Date.now() + cls.questionDuration);// Math.floor((Date.now() + questionDuration) /1000);
        data.answers = [];
        let nums = [0,1,2,3];
        for(let i = 0; i < 4; i++){
            let j = Math.floor(Math.random() * nums.length);
            data.answers.push(qa.answers[nums[j]]);
            if(nums[j] == 0){ // answers index 0 is correct answer; 
                data.correctIndex = i;
            }
            nums.splice(j,1);
        }
        data.players = players;
        return data;
    }

    SetAnswerTimer(roomId){
        let gd = gp.gameDatas[roomId];
        if(gd == null){
            return;
        }
        let round = gd.round; 
        let playersId = gp.GetPlayerIdFromObject(gd.players);
        for(let i = 0; i < 2; i++){
            if(gd.players[playersId[i]].answers.length == round - 1){
                gd.players[playersId[i]].answers.push(0);
                let json = {playerId: playersId[i], round:round,answerIndex:-1, score:gd.players[playersId[i]].score};
                cls.io.to(roomId).emit('OnGameAnswer',json);
                cls.AddAnswerHistory(playersId[i],0,qaControl.GetQuestion(cls.pvpQuestionsControl[roomId].questionsIndex[round - 1]));
            }
        }
        if(round == 10){
            cls.EmitGameFinish(roomId);
        }else{ // move next
            setTimeout(function(){
                gp.gameDatas[roomId] = cls.GetGameData(round + 1, roomId, gp.gameDatas[roomId].players);
                cls.io.to(roomId).emit('OnGameNextQuestion',gp.gameDatas[roomId]);
                cls.answerTimer[roomId] = {
                    timer:setTimeout(() => {
                        cls.SetAnswerTimer(roomId);
                    }, cls.questionDuration)
                };
            },1 * 1000);
        }
    }
    AddAnswerHistory(playerId,isCorrectAnswer,qaObj){
        cls.dbCon.Insert("INSERT INTO tblAnswerHistory (tblPlayerId,isCorrectAnswer,tblSubjectId,tblQAId,actionDate) VALUES ('"
                    +playerId+"',"+isCorrectAnswer+","+qaObj.subjectId+","+qaObj.id+",'"+Date.now()+"')", function(result){});
    }
    GameAnswer(socket, data){
        if(!cls.IsGameCondition(socket)){
            return;
        }
        let pl = gp.objPlayers[socket.id];
        let gd = gp.gameDatas[pl.roomId];
        let round = gd.round; 
        if(gd.players[pl.playerId].answers.length == round - 1){
            let isCorrect = 0;
            if(data['answerIndex'] == gd.correctIndex){ //correc Answer
                let millisec = gd.timeEnd - Date.now(); //remain millisec 
                let score = 100 + (Math.floor(millisec / 100));
                gd.players[pl.playerId].answers.push(1);
                gd.players[pl.playerId].score += score;
                isCorrect = 1;
            }else{
                gd.players[pl.playerId].answers.push(0);
            }
            cls.AddAnswerHistory(pl.playerId,isCorrect,qaControl.GetQuestion(cls.pvpQuestionsControl[pl.roomId].questionsIndex[round - 1]));
        }else if(gd.players[pl.playerId].answers.length == round){ // player round different from game round
            socket.emit('OnGameAnswer', {failed: "answered"});
            return;
        }else{
            gp.EmitPlayerExcption(socket);
            return;
        }
        let oppId = gp.GetOpponentId(gd.players,pl.playerId);
        if(gd.players[oppId].status == gp.PlayerStatus.disconnected){
            if(gd.players[oppId].answers.length == round - 1){
                gd.players[oppId].answers.push(0);
                cls.AddAnswerHistory(oppId,0,qaControl.GetQuestion(cls.pvpQuestionsControl[pl.roomId].questionsIndex[round - 1]));
            }
        }
        let json = {playerId: pl.playerId, round:round,answerIndex:data['answerIndex'], score:gd.players[pl.playerId].score};
        cls.io.to(pl.roomId).emit('OnGameAnswer',json);
        let index = gp.GetPlayerIdFromObject(gd.players);
        if(gd.players[index[0]].answers.length == gd.players[index[1]].answers.length){
            clearTimeout(cls.answerTimer[pl.roomId].timer);
            if(round == 10){ //finished
                cls.EmitGameFinish(pl.roomId);
            }else{ // move next
                setTimeout(function(){
                    gp.gameDatas[pl.roomId] = cls.GetGameData(round + 1, pl.roomId, gp.gameDatas[pl.roomId].players);
                    cls.io.to(pl.roomId).emit('OnGameNextQuestion',gp.gameDatas[pl.roomId]);
                    cls.answerTimer[pl.roomId] = {
                        timer:setTimeout(() => {
                            cls.SetAnswerTimer(pl.roomId);
                        }, cls.questionDuration)
                    };
                },1 * 1000);
            }
        }
    }
    EmitGameFinish(roomId){
        let ids = gp.GetPlayerIdFromObject(gp.gameDatas[roomId].players);
        let winnerAdd = 25, loserMinus = -20;
        cls.dbCon.Select("SELECT trophy, id FROM tblPlayer where id = " + ids[0] + " or id = " + ids[1],function(result){ //select db cuz player can be disconnected
            let playersId = [];
            let trophies = [];
            let winner = result[0]['id'];
            if(gp.gameDatas[roomId].players[result[0]['id']].score > gp.gameDatas[roomId].players[result[1]['id']].score){
                for(let i = 0; i < 2; i++){
                    playersId.push(result[i]['id']);
                    trophies.push(result[i]['trophy']);
                }
            }else if(gp.gameDatas[roomId].players[result[0]['id']].score < gp.gameDatas[roomId].players[result[1]['id']].score){
                for(let i = 1; i > -1; i--){
                    playersId.push(result[i]['id']);
                    trophies.push(result[i]['trophy']);
                }
                winner = result[1]['id'];
            }else{
                winner = "gameDraw";
                for(let i = 0; i < 2; i++){
                    playersId.push(result[i]['id']);
                    trophies.push(result[i]['trophy']);
                }
            }
            if(winner != "gameDraw"){
                trophies[0] += winnerAdd;
                trophies[1] -= loserMinus;
                if(trophies[1] < 0){
                    trophies[1] = 0;
                }
            }
            let playerData = gp.gameDatas[roomId].players;
            for(let i = 0; i < 2; i++){
                let getSid = gp.GetSocketId(playersId[i]);
                if(getSid != -1){
                    gp.objPlayers[getSid].trophy = trophies[i];
                }
                playerData[playersId[i]].trophy = trophies[i];
            }
            let js = {
                winner: winner,
                players: playerData
            };
            cls.io.to(roomId).emit('OnGameFinished',js);
            cls.dbCon.Update("UPDATE tblPlayer t1 JOIN tblPlayer t2 ON t1.id = '"+playersId[0]+"' AND t2.id = '"+playersId[1]+"' SET t1.trophy = "
                            +trophies[0]+", t2.trophy = "+trophies[1]);	
            cls.lc.WeeklyTrophySubmit(playersId[0],winnerAdd);
            cls.lc.WeeklyTrophySubmit(playersId[1],loserMinus);
        });
    }

    IsGameCondition(socket){
        if(gp.IsPlayerExisted(socket)){
            let roomId = gp.objPlayers[socket.id].roomId;
            if(gp.IsRoomId(socket, roomId)){
                if(gp.IsGameData(socket, roomId)){
                    return true;
                }
            }
        }
        return false;
    }

}

var cls = new GameController();
module.exports = cls;