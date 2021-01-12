const users = []

// addUser, removeUser, getUser, getUsersInRoom

const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const  index = users.findIndex((user) =>{
        return user.id === id
    })

    //index -1 if no match
    if (index !== -1) {
        return users.splice(index, 1)   // returns the object we want to remove
    }
}

const getUser = (id) => {
    const userData = users.find((user) => {
        return user.id === id
    })
    return userData;
}

const getUsersInRoom = (roomName) => {
    const userData = users.filter((user) => {
        return user.room === roomName
    });

    return userData;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}