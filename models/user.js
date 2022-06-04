const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true },
}
exports.UserSchema = UserSchema

async function insertNewUser(user) {
  user = extractValidFields(user, UserSchema)
  const db = getDbReference()
  const collection = db.collection('users')
  const result = await collection.insertOne(user)
  return result.insertedId
}
exports.insertNewUser = insertNewUser

async function emailAlreadyUsed(email) {
    const db = getDbReference()
    const collection = db.collection('users')
    const usersWithEmail = await collection.countDocuments({
        email: email
    })
    console.log(usersWithEmail, usersWithEmail > 0)
    if (usersWithEmail > 0) {
        return true
    }
    return false
}
exports.emailAlreadyUsed = emailAlreadyUsed

async function getUserByEmail(email) {
  const db = getDbReference()
  const collection = db.collection('users')
  if (!email) {
    return null
  } else {
    const users = await collection.find({
        email: email
    }).toArray()
    return users[0]
  }
}
exports.getUserByEmail = getUserByEmail