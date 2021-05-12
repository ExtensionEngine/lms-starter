import { extractData, processParams } from '@/common/api/helpers';
import path from 'path';
import request from '@/common/api/request';

const urls = {
  root: '/programs',
  resource: id => path.join(urls.root, String(id))
};

function get(id) {
  return request.get(urls.resource(id))
    .then(extractData);
}

function fetch(params = {}) {
  return request.get(urls.root, { params: processParams(params) })
    .then(extractData);
}

function create(item) {
  return request.post(urls.root, item)
    .then(extractData);
}

export default { get, create, fetch };
