const bcrypt = require('bcryptjs')

const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true },
  courseId: {required: false}
}
exports.UserSchema = UserSchema

async function insertNewUser(user) {
    const usertoInsert = extractValidFields(user, UserSchema)
    usertoInsert.password = await bcrypt.hash(usertoInsert.password, 8)
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertOne(usertoInsert)
    return result.insertedId
}
exports.insertNewUser = insertNewUser

async function emailAlreadyUsed(email) {
    const db = getDbReference()
    const collection = db.collection('users')
    const usersWithEmail = await collection.countDocuments({
        email: email
    })
    if (usersWithEmail > 0) {
        return true
    }
    return false
}
exports.emailAlreadyUsed = emailAlreadyUsed

async function getUserById(id) {
    const db = getDbReference()
    const collection = db.collection('users')
    if (!ObjectId.isValid(id)) {
      return null
    } else {
      const users = await collection.find({
          _id: new ObjectId(id)
      }).toArray()
      return users[0]
    }
}
exports.getUserById = getUserById

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

async function getAllUsers() {
  const db = getDbReference()
  const collection = db.collection('users')
  const users = await collection.find({}).toArray()
  return users
}
exports.getAllUsers = getAllUsers

async function deleteUserById(id) {
  const db = getDbReference();
  const collection = db.collection('users');
  const result = await collection.deleteOne({
    _id: new ObjectId(id)
  });
  return result.deletedCount > 0;
}
exports.deleteUserById = deleteUserById