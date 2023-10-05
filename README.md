# Form Response Grade
Apps Script project to set scores and feedback for Google Form responses.

Evaluates responses with `FormApp.ItemType.CHECKBOX` and `FormApp.ItemType.PARAGRAPH_TEXT` types. For `FormApp.ItemType.PARAGRAPH_TEXT` responses processes throught ChatGPT.
Prompt for ChatGPT can be configured in `src/serivce/verifier/message.js`.

## Install
Add library by script id: `AKfycbyfDXhMcritrkCzSyzmeCsy-5UuBHPV5Y_rZokUpayxtOTk_HwfRdU78WBmJi8LhhIt`.

Paste this code in the editor:
```js
function installTrigger() {
  const form = FormApp.getActiveForm();

  ScriptApp
    .newTrigger("FormResponseGrade.onFormSubmit")
    .forForm(form)
    .onFormSubmit()
    .create();
}
```

In "Function selection" menu select "installTrigger" and press "Run".

## Test
```
npm run test
```

## Build
```
npm run build
```

## Deploy
```
npm run deploy
```
