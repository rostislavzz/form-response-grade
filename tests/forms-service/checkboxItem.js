import Choice from "./choice.js";

export default class CheckboxItem {
  getChoices() {
    return [ new Choice("", false) ];
  }
}