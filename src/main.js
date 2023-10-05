import config from "./config.js";
import OpenAI from "./client/openai/index.js";
import Verifier from "./service/verifier/index.js";
import Handler from "./handler/index.js";

function onFormSubmit(event) {
  const openai = new OpenAI(config.openai);
  const verifier = new Verifier(openai);
  const handler = new Handler(verifier);

  handler.verifyFormResponse(event);
}

global.onFormSubmit = onFormSubmit;
