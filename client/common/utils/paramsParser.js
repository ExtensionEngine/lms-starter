import mapValues from 'lodash/mapValues';

const numeric = obj => mapValues(obj, Number);
Object.defineProperty(numeric, 'params', {
  get: () => ({ params }) => numeric(params)
});

export { numeric };
