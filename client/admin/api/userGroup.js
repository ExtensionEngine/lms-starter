import { extractData, processParams } from '@/common/api/helpers';
import path from 'path';
import request from '@/common/api/request';

const urls = {
  root: '/user-groups',
  resource: id => path.join(urls.root, String(id)),
  members: id => path.join(urls.resource(id), 'members')
};

function fetch(params = {}) {
  return request.get(urls.root, { params: processParams(params) })
    .then(extractData);
}

function create(item) {
  return request.post(urls.root, item).then(extractData);
}

function update(item) {
  return request.patch(urls.resource(item.id), item).then(extractData);
}

function remove(item) {
  return request.delete(urls.resource(item.id));
}

function getMembers(userGroupId, params = {}) {
  return request.get(urls.members(userGroupId), { params: processParams(params) })
    .then(extractData);
}

function addMember(item) {
  return request.post(urls.members(item.userGroupId), item).then(extractData);
}

export default {
  fetch,
  create,
  update,
  remove,
  getMembers,
  addMember
};
