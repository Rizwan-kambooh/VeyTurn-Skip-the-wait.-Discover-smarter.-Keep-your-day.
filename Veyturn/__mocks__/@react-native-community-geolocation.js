module.exports = {
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(success => success()),
  getCurrentPosition: jest.fn((success, error) => error({message: 'Location unavailable in tests'})),
};
