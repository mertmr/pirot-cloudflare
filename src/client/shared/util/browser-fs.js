export const existsSync = () => false;

export const readFileSync = () => {
  throw new Error('fs.readFileSync is unavailable in the browser');
};

export const realpathSync = value => value;

export default { existsSync, readFileSync, realpathSync };
