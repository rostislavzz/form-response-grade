export default class Choice {
  constructor(value, correct) {
    this.value = value;
    this.correct = correct;
  }

  getValue() {
    return this.value;
  }

  isCorrectAnswer() {
    return this.correct;
  }
}
