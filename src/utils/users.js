const users = []

// === add user ===
const addUser = ({id, username, room}) => {
  // == clean data ==
  username = username.trim().toLowerCase()
  room = room.trim().toLowerCase()

  // == validate data ==
  if(!username || !room) {
    return {
      error: 'username and room are required'
    }
  }

  const existingUser = users.find((user) => {
    return user.room === room && user.username === username
  })

  if(existingUser) {
    return {
      error: 'username is in use'
    }
  }

  // == store user ==
  const user = { username, id, room}
  users.push(user)
  return { user }
}

// === remove user ===
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id)

  if(index !== -1) {
    return users.splice(index, 1)[0]
  }
}

// === find user ===
const getUser = (id) => {
  return users.find((user) => user.id === id)
}

// === find all users in room ===
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room)
}

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
}