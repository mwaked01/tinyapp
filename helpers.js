const userLookup = function(email, database) {
  for (let id in database) {
    //check if given email exists in the users database
    if (database[id].email === email) {
      return database[id];
    }
  }
  return null;
};

module.exports = userLookup;