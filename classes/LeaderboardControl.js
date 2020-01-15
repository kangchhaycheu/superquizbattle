var moment = require('moment');
let startDate = moment({hour:09,minute:00,second:00}).isoWeekday(1);
let endDate = moment({hour:10,minute:00,second:00}).isoWeekday(7);
let nextWeekDate = moment({hour:09,minute:00,second:00}).isoWeekday(1).add(1,"week");
class LeaderboardControl{
    InstantObject(dbCon, moment){
        cls.dbCon = dbCon;
        cls.moment = moment;
    }
    Debuglog(){
        // console.log(startDate.diff(moment()) + " end = " + endDate.diff(moment()));
    }

    WeeklyTrophySubmit(playerId, trophy){
        if(startDate.diff(moment()) > 0 || endDate.diff(moment()) < 1){ // event ended, canceled submit
            return;
        }
        let weekId = cls.GetCurrentWeekId();
        cls.dbCon.Select("SELECT * FROM tblLeaderboard WHERE tblPlayerId = " + playerId + " and weekId = '" + weekId +"'", function(result){
            if(result.length > 0){
                let tp = result[0]['trophy'] + trophy;
                if(tp < 0){
                    tp = 0;
                }
                cls.dbCon.Update("Update tblLeaderboard set trophy = "+ tp + ", lastUpdate = '"+Date.now()+"' where id = '" + playerId + "'");
            }else{
                if(trophy < 0){
                    trophy = 0;
                }
                cls.dbCon.Insert("INSERT INTO tblLeaderboard (tblPlayerId, trophy, weekId, lastUpdate) VALUES ('"+playerId+"',"+trophy+","+weekId+",'"+Date.now()+"')",function(result){
                });
            }
        });
       // $sql = "SELECT * from tblplayer a WHERE playerid = '".$phoneNumber."'";
      // $sqlUpdate = "UPDATE tblplayer set playername = '".$playerName."',score = ".$postScore.",wave = ".$wave.", lastUpdate = '".$now."', playtime = '".$duration."' where playerid = '".$phoneNumber."'";
    //   $sqlInsert = "INSERT INTO tblplayer(playerid,playername,score,logindate,lastUpdate,playtime) values('".$phoneNumber."','".$playerName."',".$postScore.",'".$now."','".$now."','".$duration."')";                         
    }
    GetCurrentWeekId(){
        return moment().isoWeekYear() + ""+ moment().isoWeek();
    }

    GetWeeklyLeaderboard(){
        let weekId; 
        let remainSnd = moment().diff(startDate);
        let isRunning = false;
        if(remainSnd < 1){// if event not start yet for new week
            //query leaderboard with weekid - 1
            weekId = cls.GetCurrentWeekId() - 1;
        }else {
            weekId = cls.GetCurrentWeekId();
            remainSnd = endDate.diff(moment());
            if(remainSnd < 1){ // event end.
                remainSnd = nextWeekDate.diff(moment());
            }else{ //during event
                isRunning = true;
            }
        }
        let json = {};
        json.isWeeklyRunning = isRunning;
        json.remainSecond = ""+(Math.floor(remainSnd/1000));
        let sql = "SELECT tblPlayer.playerName, b.tblPlayerId, b.trophy, 1+(SELECT count(*) from tblLeaderboard a WHERE a.trophy > b.trophy and weekId = '"+weekId+"') " +
                  "as ranking FROM tblLeaderboard b inner join tblPlayer on tblPlayer.id = b.tblPlayerId where b.weekId = '"+weekId+"' "+
                  " and b.trophy > 0 ORDER by b.trophy DESC limit 50";
        // let sql = "SELECT tblPlayerId, trophy, 1+(SELECT count(*) from tblLeaderboard a WHERE a.trophy > b.trophy) as ranking FROM tblLeaderboard b where weekId = '"
        //           +weekId+"' and trophy > 0 ORDER by trophy DESC limit 50";
        cls.dbCon.Select(sql, function(result){
            json.players = [];
            if(result.length > 0){
                json.players = result;
            } console.log(JSON.stringify(json));
        });
        // console.log(JSON.stringify(json));
    }

    GetRemainSecond(){
        // let startDate = cls.moment({hour:09,minute:00,second:00}).isoWeekday(1);
        // let endDate = cls.moment({hour:10,minute:01,second:00}).isoWeekday(2);
        // // console.log(startDate.toString());
        // let rsnd = endDate.diff(cls.moment());
    }
}
var cls = new LeaderboardControl();
module.exports = cls;