class QuestionControl{
    constructor(){
        this.questions = [];
    }
    AddQuestion(question, answer, choice1,choice2,choice3, difficulty){
        let q = new Question(question, answer, choice1,choice2,choice3, difficulty);
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

function Question(question, answer, choice1,choice2,choice3, difficulty){
     this.question = question;
     this.answers = [answer,choice1,choice2,choice3]; // answers index 0 is correct answer.
    //  this.answer = answer;
    //  this.choice1 = choice1;
    //  this.choice2 = choice2;
    //  this.choice3 = choice3;
     this.difficulty = difficulty
}

var expQuestion = new QuestionControl();
module.exports = expQuestion;