import CheckboxItem from "./checkboxItem.js";

export default class Item {
  getIndex() {
    return 0;
  }

  asCheckboxItem() {
    return new CheckboxItem();
  }
}
