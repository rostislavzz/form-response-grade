import Item from "./forms-service/item.js";
import ItemResponse from "./forms-service/itemResponse";
import CheckboxItem from "./forms-service/checkboxItem.js";
import Choice from "./forms-service/choice.js";
import Verifier from "../src/service/verifier/index.js";

jest.mock("./forms-service/itemResponse.js");
jest.mock("./forms-service/checkboxItem.js");

beforeEach(() => {
  ItemResponse.mockClear();
  CheckboxItem.mockClear();
});

const verifier = new Verifier("openai");
const item = new Item();
const itemResponse = new ItemResponse();

it("Check Verifier. Choices: 6, Correct: 3, Selected: 3, Wrong: 1 => Score: 1", () => {
  const getChoices = jest
    .spyOn(CheckboxItem.prototype, "getChoices")
    .mockReturnValue([
      new Choice("value 1", true),
      new Choice("value 2", true),
      new Choice("value 3", true),
      new Choice("value 4", false),
      new Choice("value 5", false),
      new Choice("value 6", false),
    ]);

  const getResponse = jest
    .spyOn(itemResponse, "getResponse")
    .mockReturnValue(["value 2", "value 3", "value 4"]);

  const score = verifier.getScore(item, itemResponse);

  expect(getChoices).toHaveBeenCalled();
  expect(getResponse).toHaveBeenCalled();
  expect(score).toBe(1);
});

it("Check Verifier. Choices: 6, Correct: 3, Selected: 1, Wrong: 1 => Score: 0", () => {
  const getChoices = jest
    .spyOn(CheckboxItem.prototype, "getChoices")
    .mockReturnValue([
      new Choice("value 1", true),
      new Choice("value 2", true),
      new Choice("value 3", true),
      new Choice("value 4", false),
      new Choice("value 5", false),
      new Choice("value 6", false),
    ]);

  const getResponse = jest
    .spyOn(itemResponse, "getResponse")
    .mockReturnValue(["value 4"]);

  const score = verifier.getScore(item, itemResponse);

  expect(getChoices).toHaveBeenCalled();
  expect(getResponse).toHaveBeenCalled();
  expect(score).toBe(0);
});

it("Check Verifier. Choices: 6, Correct: 4, Selected: 2, Wrong: 0 => Score: 0", () => {
  const getChoices = jest
    .spyOn(CheckboxItem.prototype, "getChoices")
    .mockReturnValue([
      new Choice("value 1", true),
      new Choice("value 2", true),
      new Choice("value 3", true),
      new Choice("value 4", true),
      new Choice("value 5", false),
      new Choice("value 6", false),
    ]);

  const getResponse = jest
    .spyOn(itemResponse, "getResponse")
    .mockReturnValue(["value 1", "value 2"]);

  const score = verifier.getScore(item, itemResponse);

  expect(getChoices).toHaveBeenCalled();
  expect(getResponse).toHaveBeenCalled();
  expect(score).toBe(0);
});
