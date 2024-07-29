# lowdb-models

> Simple model implementation to use with lowdb
>
> Allows to check for data duplication, required values, and some other features

## Install

```sh
npm install lowdb-models
```

## Usage
_Be aware that lowdb could change it's instance method_
```js
import { JSONFilePreset } from 'lowdb/node' // This could change
import { newModel } from 'lowdb-models'
```

Creating a model
```js
var Posts = newModel({
  id: {
    required: true,
    unique: true
  },
  title: {
    required: true
  },
  author: {
    required: true
  }
}, {tableName: 'posts'})
```
```js
// Lowdb instance
const db = await JSONFilePreset('db.json', {})

// Initialize the model
Posts.init(db)
```

Writing data

```js
Posts.create({id: 1, title: 'Cool title', author: 'John'})
```
Model's data is kept inside it's tableName value
```js
// db.json
{
  "posts": [
    { "id": 1, "title": "Cool title", "author": 'John' }
  ]
}
```

Retrieving data
```js
Posts.findAll()
>> [{id: 1, title: 'Cool title', author: 'John'}] 
```

```js
Posts.find({ title: 'title' })
```
```js
Posts.findOne({ id: 1 })
```

Update
```js
Posts.update({ id: 1},
  {
    title: 'New cool title'
  })
```

Deleting data
```js
await Posts.remove({ id: 1 })
// Or
await Posts.remove({ title: 'New cool title' })
```

### Generate property

Allow it to use a function wich will be execute before create and it return value is set to the property

Can be used to generate id

```js
import { uuid } from 'uuidv4'

var Posts = newModel({
  id: {
    required: true,
    unique: true,
    generate: () => uuid()
  }
}, {tableName: 'posts'})
```