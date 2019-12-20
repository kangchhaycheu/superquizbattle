class QuestionControl{
    constructor(){
        this.questions = [];
    }
    AddQuestion(question, answer, choice1,choice2,choice3, difficulty){
        let q = new Question(question, answer, choice1,choice2,choice3, difficulty);
        this.questions.push(q);
    }
    GetQuestion(){
        return this.questions[101];
    }

}

function Question(question, answer, choice1,choice2,choice3, difficulty){
     this.question = question;
     this.answer = answer;
     this.choice1 = choice1;
     this.choice1 = choice2;
     this.choice1 = choice3;
     this.difficulty = difficulty
}

var expQuestion = new QuestionControl();
module.exports = expQuestion;