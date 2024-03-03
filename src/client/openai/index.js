export default class OpenAI {
  constructor({ token }) {
    this.token = token;
    this.url = 'https://api.openai.com/v1/chat/completions';
  }

  chat(system, user) {
    const params = {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "Authorization": `Bearer ${this.token}`
      },
      "payload": this.getPayload(system, user),
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

  getPayload(system, user) {
    const payload = {
      "model": "gpt-3.5-turbo",
      "messages": [
        {
          "role": "system",
          "content": system
        },
        {
          "role": "user",
          "content": user
        }
      ]
    }

    return JSON.stringify(payload)
  }
}
