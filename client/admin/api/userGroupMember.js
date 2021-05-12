import { extractData, processParams } from '@/common/api/helpers';
import path from 'path';
import request from '@/common/api/request';

const urls = {
  root: id => path.join('user-groups', String(id), 'members'),
  resource: ({ userId, userGroupId }) => path.join(urls.root(userGroupId), String(userId))
};

function fetch(userGroupId, params = {}) {
  return request.get(urls.root(userGroupId), { params: processParams(params) })
    .then(extractData);
}

function create(item) {
  return request.post(urls.root(item.userGroupId), item)
    .then(extractData);
}

function update(item) {
  return request.patch(urls.resource(item), item)
    .then(extractData);
}

function remove(item) {
  return request.delete(urls.resource(item), item)
    .then(extractData);
}

export default {
  fetch,
  create,
  update,
  remove
};
