export default class Handler {
  constructor(verifier) {
    this.verifier = verifier;
    this.allowedItemTypes = [FormApp.ItemType.CHECKBOX, FormApp.ItemType.PARAGRAPH_TEXT];
  }

  verifyFormResponse(event) {
    console.info("Handler. Verify form response");

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
