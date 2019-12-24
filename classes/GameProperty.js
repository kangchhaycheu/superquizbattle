PlayerStatus = {
    abc: "Disconnected",
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
    let ids = this.GetPlayerIdFromObject(players);
    if(ids[0] == playerId){
        return ids[1];
    }else{
        return ids[0];
    }
}

module.exports = { PlayerStatus: PlayerStatus,GetOpponentId: GetOpponentId, GetPlayerIdFromObject: GetPlayerIdFromObject };

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