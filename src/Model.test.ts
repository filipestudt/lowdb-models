import assert from 'node:assert/strict'
import { JSONFilePreset } from 'lowdb/node'
import { newModel } from './Model.js'

async function createModel() {  
  let db = await JSONFilePreset('testdb.json', {})
  let Posts = newModel({
    id: {
      required: true,
      unique: true
    },
    title: {},
    content: {}
  }, {tableName: 'posts'})
  Posts.init(db)
  return Posts
}

async function create(Posts) {
  await Posts.create({id: 1, title: 'Title'})
  assert.equal((await Posts.find({id: 1})).length, 1)

  try {
    await Posts.create({id: 1, title: 'Title'})
  } catch(err) {
    assert.equal(err.message, 'Duplicated')
  }

  try {
    await Posts.create({id: 2})
  } catch(err) {
    assert.equal(err.message, 'Required')
  }

  assert.equal((await Posts.find({id: 2})).length, 0)
}

async function update(Posts) {
  await Posts.update({id: 1}, {title: 'New Title'})
  assert.equal((await Posts.find({id: 1, title: 'New Title'})).length, 1)

  await Posts.update({id: 1}, {author: 'John'})
  assert.equal((await Posts.find({id: 1, author: 'John'})).length, 0)
}

async function remove(Posts) {
  await Posts.remove({id: 1})
  assert.equal((await Posts.find({id: 1})).length, 0)
}

export async function test() {
  let Posts = await createModel()
  await create(Posts)
  await update(Posts)
  await remove(Posts)
}
