import { extractData, processParams } from '@/common/api/helpers';
import path from 'path';
import request from '@/common/api/request';

const urls = {
  root: '/enrollments',
  resource: id => path.join(urls.root, String(id))
};

function fetch(opts) {
  return request.get(urls.root, { params: processParams(opts) })
    .then(extractData);
}

function create(payload) {
  return request.post(urls.root, payload)
    .then(extractData);
}

function remove(item) {
  return request.delete(urls.resource(item.id));
}

export default {
  fetch,
  create,
  remove
};
