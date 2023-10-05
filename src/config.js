const properties = PropertiesService.getScriptProperties();

export default {
  openai: {
    token: properties.getProperty("OPENAI_TOKEN")
  }
};
