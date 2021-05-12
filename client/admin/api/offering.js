import { extractData, processParams } from '@/common/api/helpers';
import path from 'path';
import request from '@/common/api/request';

const urls = {
  root: '/offerings',
  userGroups: id => path.join(urls.root, String(id), 'user-groups'),
  userGroupResource: ({ userGroupId, offeringId }) => {
    return path.join(urls.userGroups(offeringId), String(userGroupId));
  }
};

function fetch(params = {}) {
  return request.get(urls.root, { params: processParams(params) })
    .then(extractData);
}

function getUserGroups(offeringId, params = {}) {
  return request.get(urls.userGroups(offeringId), { params: processParams(params) })
    .then(extractData);
}

function addUserGroup(item) {
  return request.post(urls.userGroups(item.offeringId), item)
    .then(extractData);
}

function removeUserGroup(item) {
  return request.delete(urls.userGroupResource(item), item)
    .then(extractData);
}

export default {
  fetch,
  getUserGroups,
  addUserGroup,
  removeUserGroup
};
