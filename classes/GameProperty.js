var objPlayers = {}
var gameDatas = {};

PlayerStatus = {
    disconnected: "Disconnected",
    online: "Online",
    home:"Home",
    findMatch: "FindMatch",
    inGame:"InGame",
    giveUp:"GiveUp",
    matchPending: "MatchPending"
}

function GetPlayerIdFromObject(players){
    var tempID = [];
    for(var ids in players){
        tempID.push(ids);
    }
    return tempID;
}

function GetOpponentId(players,playerId){
    let ids = GetPlayerIdFromObject(players);
    if(ids[0] == playerId){
        return ids[1];
    }else{
        return ids[0];
    }
}

function IsPlayerExisted(socket){
    if(objPlayers[socket.id] == null){
        EmitPlayerExcption(socket);
        return false;
    }
    return true;
}   
function IsGameData(socket, roomId){
    if(gameDatas[roomId] == null){
        EmitPlayerExcption(socket);
        return false;
    }
    return true;
} 
function IsRoomId(socket, roomId){
    if(roomId == "-1"){
        EmitPlayerExcption(socket);
        return false;
    }
    return true;
}

function EmitPlayerExcption(socket){
    if(objPlayers[socket.id] != null){
        delete objPlayers[socket.id];
    }
    socket.emit("OnPlayerException",{});
}
function GetSocketId(playerId){
    for(var sid in objPlayers){
        if(objPlayers[sid].playerId == playerId){
            return sid;
        }
    }
    return -1;
}
function PlayerInformation(sid){
    var pl = {
        playerId : objPlayers[sid].playerId,
        playerName : objPlayers[sid].playerName
    };
    return pl;
}

module.exports = { 
    EmitPlayerExcption,
    PlayerInformation,
    GetSocketId,
    PlayerStatus,
    GetOpponentId,
    GetPlayerIdFromObject,
    IsPlayerExisted,
    IsGameData,
    IsRoomId,
    objPlayers,
    gameDatas
};


// module.exports.GetPlayerIdFromObject = function(players){
//     var tempID = [];
//     for(var ids in players){
//         tempID.push(ids);
//     }
//     return tempID;
// }

// module.exports.GetOpponentId = function(players,playerId){
//     let ids = this.GetPlayerIdFromObject(players);
//     if(ids[0] == playerId){
//         return ids[1];
//     }else{
//         return ids[0];
//     }
// }