const inputToken = 'abc123';
module.exports.INPUT_TOKEN = inputToken;

const defaultInputs = {
  access_token: inputToken
};
module.exports.DEFAULT_INPUTS = defaultInputs;

module.exports.setInputs = (inputs) => {
  Object.entries({ ...defaultInputs, ...inputs }).forEach(([key, value]) => {
    process.env[`INPUT_${key.toUpperCase()}`] = value;
  });
};

module.exports.unsetInputs = (inputKeys = []) => {
  [...Object.keys(defaultInputs), ...inputKeys].forEach((keys) => {
    delete process.env[`INPUT_${keys.toUpperCase()}`];
  });
};
