const stored = new Map();

module.exports = {
  getGenericPassword: jest.fn(async options => stored.get(options?.service ?? 'default') ?? false),
  setGenericPassword: jest.fn(async (username, password, options) => {
    stored.set(options?.service ?? 'default', {username, password});
    return true;
  }),
  resetGenericPassword: jest.fn(async options => {
    stored.delete(options?.service ?? 'default');
    return true;
  }),
};
