import { MESSAGE_TEMPLATE } from "./message";

export default class Verifier {
  constructor(openai) {
    this.openai = openai;
  }

  getScore(item, itemResponse) {
    const index = item.getIndex();
    const choices = item.asCheckboxItem().getChoices();
    const itemCorrectAnswerCount = this.getItemCorrectAnswerCount(choices);

    console.info(`Item №${index}. Choices: ${choices.length}, correct: ${itemCorrectAnswerCount}`);

    let response = itemResponse.getResponse();
    let responseCorrectAnswerCount = this.getItemResponseCorrectCount(response, choices);
    let responseWrongAnswerCount = response.length - responseCorrectAnswerCount;

    console.info(`Item №${index}. Response. Selected: ${response.length}, correct: ${responseCorrectAnswerCount}, wrong: ${responseWrongAnswerCount}`);

    // Пропуск ответа если число не правильно выбранных вариантов 2 и более
    if (responseWrongAnswerCount >= 2) {
      console.info(`Item №${index}. The number of incorrect answers >= 2. Score: 0`);
      return 0;
    }

    if (responseCorrectAnswerCount > itemCorrectAnswerCount / 2) {
      console.info(`Item №${index}. Score: 1`);
      return 1;
    }

    console.info(`Item №${index}. Score: 0`);
    return 0;
  }

  getScoreAndFeedback(item, itemResponse) {
    const index = item.getIndex();
    const feedback = itemResponse.getFeedback();
    if (feedback !== null) {
      console.info("Item №%s. Feedback already set. Skip", index);
      return false;
    }

    const response = itemResponse.getResponse();
    if (response.length <= 3) {
      console.info("Item №%s. Response is too short. Skip", index);
      return false;
    }

    const textItem = item.asParagraphTextItem();
    const points = textItem.getPoints();
    if (points < 2) {
      console.info("Item №%s. Point value of a gradeable item < 2. Skip", index);
      return false;
    }

    let message = MESSAGE_TEMPLATE.replace("{points}", points);
    message = message.replace("{question}", textItem.getTitle());
    message = message.replace("{answer}", response);
    console.info(`Item №${index}. Message: ${message}`);

    const answer = this.openai.chat(message);
    if (!answer) {
      console.info(`Item №${index}. ChatGPT did not give an answer`);
      return false;
    }

    console.info(`Item №${index}. Feedback: ${answer}`);

    const result = {
      score: this.parseScoreFromAnswer(answer),
      feedback: FormApp.createFeedback().setText(answer).build()
    }

    return result;
  }

  getItemCorrectAnswerCount(choices) {
    return choices.filter(choise => choise.isCorrectAnswer()).length;
  }

  getItemResponseCorrectCount(response, choices) {
    const correctValues = choices.map(choise => choise.isCorrectAnswer() && choise.getValue());
    return response.filter(item => correctValues.includes(item)).length
  }

  parseScoreFromAnswer(answer) {
    const re = new RegExp(/Баллы: (\d)/, "i");

    const match = re.exec(answer);
    if (match === null) {
      return false;
    }

    const score = parseInt(match[1], 10);
    if (isNaN(score)) {
      return false;
    }

    return score;
  }
}
