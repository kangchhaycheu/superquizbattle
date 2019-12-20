
//Caller script
// var s = require('./classes.js');
// console.log(s.getName());
//
// var name = "Jhon";
// exports.getName = function() {
//   return name;
// }


const mysql = require('mysql');
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'chhaycheu',
    password : 'Osja1234',
    database : 'CellcardSuperQuiz'
});

db.connect((err) => {
    if(err){
        throw err;
    }
    // console.log('MySql Connected...');
});

module.exports = {
    Select : function(sql, callback){
        let query = db.query(sql, (err, results) => {
            if(err) throw err;
            callback(results);
        });
    },
    InsertPlayer : function (jsonObject,callback){
        // let post = {title:'Post One', body:'This is post number one'};
        let sql = 'INSERT INTO tblPlayer SET ?';
        let query = db.query(sql, jsonObject, (err, result) => {
            if(err) throw err;
            // console.log(result);
            callback(result);
        });
    },
    Insert : function (sql, callback){
        // let post = {title:'Post One', body:'This is post number one'};
        db.query(sql, function (err, result) {
            if(err) {
                console.log("error ======= " + err);
                throw err;
            }
            callback(result);
        });
    },
    Update : function (sql){
        let query = db.query(sql, (err, result) => {
            if(err) throw err;
            // console.log(result);
        });
    },
    Detele : function (sql, callback){
        let query = db.query(sql,(err,result) => {
            if(err) throw err;
            callback(result);
        });
    }
}
