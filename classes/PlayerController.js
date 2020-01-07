var dbCon = require('../dbControl.js');
var gp = require('./GameProperty.js');
var game = require('./GameController.js');
var shortId = require('shortid');

class PlayerController{

    Login(socket, data){
        if(data["loginAs"] == "guest"){
            pc.LoginAsGuest(socket,data);
        }
    }

    LoginAsGuest(socket, data){
		dbCon.Select("SELECT * FROM tblPlayer where guestId = '" + data['id'] + "'",function(result){
			if(result.length > 0){
				pc.ExistedPlayer(socket, result[0]);
			}else{
				pc.NewPlayer("guestId",data['id'],"Guest",socket);
			}
		});
    }

    ExistedPlayer(socket, result){
        if(result["isActive"] == 1){ //other device login,
			var getSid = gp.GetSocketId(result["id"]);
			if(getSid != -1){
				socket.broadcast.to(getSid).emit('OnOtherDeviceLogin', {});
				delete gp.objPlayers[getSid];
			}
		}
        let currentPlayer = {};
        let getPlayerId  = result['id'];
        currentPlayer.playerId = getPlayerId;
        currentPlayer.playerName = result["playerName"];
        currentPlayer.level = result['level'];
        currentPlayer.status = gp.PlayerStatus.home;
        currentPlayer.isNewPlayer = false;
        socket.emit('OnLobby', currentPlayer);
        currentPlayer.roomId = '-1';
        gp.objPlayers[socket.id] = currentPlayer;
		dbCon.Update("Update tblPlayer set isActive = 1, lastLogin = '"+Date.now()+"' where id = '" + getPlayerID + "'");
    }
    
	NewPlayer(idType, id, playerName,socket){
		var currentPlayer = {};
		dbCon.Insert("INSERT INTO tblPlayer (playerId, playerName,level,coin,trophy,isActive,lastLogin,"+idType+") VALUES ('','"+playerName+"',1,0,0,1,'"+Date.now()+"','"+id+"')",function(result){
			currentPlayer.playerId = result.insertId;
			currentPlayer.playerName = playerName;
            currentPlayer.level = 1;
            currentPlayer.status = gp.PlayerStatus.home;
            currentPlayer.isNewPlayer = true;
            socket.emit('OnLobby', currentPlayer);
            currentPlayer.roomId = '-1'
            gp.objPlayers[socket.id] = currentPlayer;
		});
    }

    FindMatch(socket){
        if(gp.IsPlayerExisted(socket)){
            socket.emit('OnFindingMatch',{message:"Finding Match"});
            gp.objPlayers[socket.id].status = gp.PlayerStatus.findMatch;
            for(var sid in gp.objPlayers){ //loop through all find match player
				if(gp.objPlayers[sid].status == gp.PlayerStatus.findMatch && sid != socket.id){// && IsMmrMatch(plMmr,gp.objPlayers[sid].mmr,(findRange * 150))){ disable mmr for test
					pc.SetDetailMatchFound(socket,sid);
				}
			}
        }
    }

    SetDetailMatchFound(socket,othSid){
		var roomId = shortId.generate();
		gp.objPlayers[othSid].roomId = roomId;
		gp.objPlayers[othSid].status = gp.PlayerStatus.matchPending;
		gp.objPlayers[socket.id].roomId = roomId;
		gp.objPlayers[socket.id].status = gp.PlayerStatus.matchPending;
		socket.broadcast.to(othSid).emit("OnMatchFound", {'roomId': roomId,'opponentInfo':gp.PlayerInformation(socket.id)});
        socket.emit("OnMatchFound", {'roomId': roomId, 'opponentInfo':gp.PlayerInformation(othSid)});
        game.InitGame(socket.id,othSid,roomId);
    }

   CancelMatchFinding(socket){
		if(gp.IsPlayerExisted(socket)){
			if(gp.objPlayers[socket.id].status == gp.PlayerStatus.findMatch){
				gp.objPlayers[socket.id].status = gp.PlayerStatus.home;
				socket.emit('OnCanceledMatchFinding',{});
			}
		}
	}

    Lobby(socket){
        if(gp.IsPlayerExisted(socket)){
            gp.objPlayers[socket.id].status = gp.PlayerStatus.home;
            socket.emit('OnLobby',gp.objPlayers[socket.id]);
        }
    }
    Disconnected(socket){
        if(gp.IsPlayerExisted(socket)){
            var pl = gp.objPlayers[socket.id];
            dbCon.Update("Update tblPlayer set isActive = 0 where id = '" + pl.playerId + "'");
            var gd = gp.gameDatas[pl.roomId];
            if(pl.status == gp.PlayerStatus.inGame){ // disconnect while in game
                if(gd != null){ //game still in process
                    gd.players[pl.playerId].status = gp.PlayerStatus.disconnected;
                    if(gd.players[gp.GetOpponentId(gd.players,pl.playerId)].status == gp.PlayerStatus.disconnected){ // both player disconnected
                        delete gp.gameDatas[pl.roomId];
                        delete game.pvpQuestionsControl[pl.roomId]; 
                    }else{
                        io.to(pl.roomId).emit('OnOpponentDisconnected',{id:pl.playerId}); // send to another player except disconnector
                    }
                }
            }
            delete gp.objPlayers[socket.id];
        }
    }
}
var pc = new PlayerController();
module.exports = pc;


