function onFormSubmit() {
}/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/config.js
const properties = PropertiesService.getScriptProperties();

/* harmony default export */ const config = ({
  openai: {
    token: properties.getProperty("OPENAI_TOKEN")
  }
});

;// CONCATENATED MODULE: ./src/client/openai/index.js
class OpenAI {
  constructor({ token }) {
    this.token = token;
    this.url = 'https://api.openai.com/v1/chat/completions';
  }

  chat(message) {
    const params = {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "Authorization": `Bearer ${this.token}`
      },
      "payload": this.getPayload(message),
      "muteHttpExceptions": false,
      "followRedirects": false
    };

    const response = UrlFetchApp.fetch(this.url, params);
    if (response.getResponseCode() !== 200) {
      return false;
    }

    const text = response.getContentText();
    if (text.length === 0) {
      return false;
    }

    const resp = JSON.parse(text);
    const answer = resp.choices[0].message.content;
    if (!answer || answer.length === 0) {
      return false;
    }

    return answer;
  }

  getPayload(content) {
    const payload = {
      "model": "gpt-3.5-turbo",
      "messages": [
        {
          "role": "system",
          "content": "Количество поставленных баллов укажи в формате: 'Баллы: число'."
        },
        {
          "role": "user",
          "content": content
        }
      ]
    }

    return JSON.stringify(payload)
  }
}

;// CONCATENATED MODULE: ./src/service/verifier/message.js
const MESSAGE_TEMPLATE = "Тебе нужно оценить правильность всего ответа на поставленный вопрос в целых баллах от 0 (ответа нет, либо он абсолютно не верный) до {points} (развернутый, правильный ответ) и дать подробное обоснование поставленным баллам. Если ответ не достаточно полный, то приведи пример подробного ответа на поставленный вопрос. Вопрос: {question} Ответ: {answer}";

;// CONCATENATED MODULE: ./src/service/verifier/index.js


class Verifier {
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

;// CONCATENATED MODULE: ./src/handler/index.js
class Handler {
  constructor(verifier) {
    this.verifier = verifier;
    this.allowedItemTypes = [FormApp.ItemType.CHECKBOX, FormApp.ItemType.PARAGRAPH_TEXT];
  }

  verifyFormResponse(event) {
    console.info("Trigger. Verify form response");

    const form = event.source;
    const items = form.getItems();
    if (items.length === 0) {
      return;
    }

    let submitRequired = false;
    const formResponse = event.response;

    console.info(`Respondent email: ${formResponse.getRespondentEmail()}`);
    console.info(`Edit response URL: ${formResponse.getEditResponseUrl()}`);

    for (let i = 0; i < items.length; i++) {
      const itemType = items[i].getType();
      if (this.allowedItemTypes.indexOf(itemType) === -1) {
        console.info(`Item №${items[i].getIndex()}. Not supported item type: ${itemType}. Skip`);
        continue;
      }

      const itemResponse = formResponse.getGradableResponseForItem(items[i]);
      if (itemResponse.getScore() !== 0) {
        console.info(`Item №${items[i].getIndex()}. Score already set: ${itemResponse.getScore()}. Skip`);
        continue;
      }

      if (itemType === FormApp.ItemType.CHECKBOX) {
        const score = this.verifier.getScore(items[i], itemResponse);

        if (score == itemResponse.getScore()) {
          console.info(`Item №${items[i].getIndex()}. Score already set: ${itemResponse.getScore()}. Skip`);
          continue;
        }

        itemResponse.setScore(score);
        submitRequired = true;
      }

      if (itemType === FormApp.ItemType.PARAGRAPH_TEXT) {
        const { score, feedback } = this.verifier.getScoreAndFeedback(items[i], itemResponse);
        if (score) {
          itemResponse.setScore(score);
        }

        if (feedback) {
          itemResponse.setFeedback(feedback);
        }

        // Лимит на выполнение скрипта 6 минут (https://developers.google.com/apps-script/guides/services/quotas),
        // но получение ответа от ChatGPT могло занять много времени.
        // Поэтому, если получили ответ, сразу сохраняем и выходим.
        if (score || feedback) {
          formResponse.withItemGrade(itemResponse);
          form.submitGrades([formResponse]);
          break;
        }
      }

      formResponse.withItemGrade(itemResponse);
    }

    if (submitRequired) {
      form.submitGrades([formResponse]);
    }
  }

  logResponsesInfo() {
    let form = FormApp.getActiveForm();
    let responses =  form.getResponses();

    responses.forEach(response => {
      console.info(`Respondent email: ${response.getRespondentEmail()}`);
      console.info(`Edit response URL: ${response.getEditResponseUrl()}`);
    });
  }
}

;// CONCATENATED MODULE: ./src/main.js





function onFormSubmit(event) {
  const openai = new OpenAI(config.openai);
  const verifier = new Verifier(openai);
  const handler = new Handler(verifier);

  handler.verifyFormResponse(event);
}

__webpack_require__.g.onFormSubmit = onFormSubmit;

/******/ })()
;