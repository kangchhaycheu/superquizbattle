class QuestionControl{
    constructor(){
        this.questions = [];
    }
    AddQuestion(id, question, answer, choice1,choice2,choice3,subjectId, difficulty){
        let q = new Question(id,question, answer, choice1,choice2,choice3,subjectId, difficulty);
        this.questions.push(q);
    }
    GetQuestion(index){
        return this.questions[index];
    }
    GenerateQuestionsIndex(){
        var i = 0;
        var randomedIndex = [];
        while(i < 10){
            var randIndex = Math.floor(Math.random() * this.questions.length);
            var isExisted = false;
            for(var j = 0; j < randomedIndex.length; j++){
                if(randomedIndex[j] == randIndex){
                    isExisted = true;
                    break
                }
            } 
            if(!isExisted){
                randomedIndex.push(randIndex);
                i ++;
            }
        }
        return randomedIndex;
    }
}

function Question(id, question, answer, choice1,choice2,choice3,subjectId, difficulty){
    this.id = id;
    this.question = question;
    this.answers = [answer,choice1,choice2,choice3]; // answers index 0 is correct answer.
    this.difficulty = difficulty;
    this.subjectId = subjectId;
}

var expQuestion = new QuestionControl();
module.exports = expQuestion;