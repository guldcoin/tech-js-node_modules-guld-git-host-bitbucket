const bitbucketjs = require('bitbucketjs')
const { getName, getAlias } = require('guld-user')
const { getPass } = require('guld-pass')
const HOST = 'bitbucket'
var client

async function getClient (user) {
  user = user || await getName()
  var pass = await getPass(`${user}/git/${HOST}`)
  return new bitbucketjs({ // eslint-disable-line new-cap
    username: pass.login,
    password: pass.password
  })
}

function parseRepo (repo) {
  var privacy
  var mainbranch
  if (repo.is_private) privacy = 'private'
  else privacy = 'public'
  if (repo.mainbranch && repo.mainbranch.name) mainbranch = repo.mainbranch.name
  else mainbranch = repo.owner.name
  return {
    name: repo.name,
    privacy: privacy,
    owner: repo.owner.name,
    mainbranch: mainbranch
  }
}

async function createRepo (rname, user, privacy = 'public', options = {}) {
  // validate required field(s)
  if (typeof rname !== 'string' || rname.length === 0) throw new Error('Name is required to create repo.')
  user = user || await getName()
  var hostuser = await getAlias(user, HOST) || user
  // set privacy
  if (!options.hasOwnProperty('is_private')) {
    if (privacy === 'public') options.is_private = false // eslint-disable-line camelcase
    else options.is_private = true // eslint-disable-line camelcase
  }
  // assume git
  if (!options.hasOwnProperty('scm')) options.scm = 'git'
  client = client || await getClient(user)
  return parseRepo(await client.repo.create(`${hostuser}/${rname}`, options))
}

async function listRepos (user) {
  user = user || await getName()
  var hostuser = await getAlias(user, HOST) || user
  client = client || await getClient(user)
  var ls = await client.repo.forOwner(hostuser)
  return ls.values.map(parseRepo)
}

async function deleteRepo (rname, user) {
  user = user || await getName()
  var hostuser = await getAlias(user, HOST) || user
  client = client || await getClient(user)
  return client.repo.delete(`${hostuser}/${rname}`)
}

module.exports = {
  getClient: getClient,
  createRepo: createRepo,
  listRepos: listRepos,
  deleteRepo: deleteRepo
}
