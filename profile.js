const sqlite3 = require('sqlite3').verbose(),
  db = new sqlite3.Database('profile.db'),
  randomstring = require("randomstring"),
  crypto = require('crypto');


function install(){
  return new Promise(function(resolve, reject){
    let query = "";
    query += 'CREATE TABLE IF NOT EXISTS profile (';
    query += 'id INTEGER PRIMARY KEY AUTOINCREMENT,';
    query += 'username VARCHAR(255),';
    query += 'email VARCHAR(255),';
    query += 'password VARCHAR(255),';
    query += 'salt VARCHAR(255)';
    query += ')';
    return db.run(query, function(err){
      if(err){
        reject(err);
      }
      resolve();
    });
  })
  .then(function(){
    let query = "";
    query += 'CREATE TABLE IF NOT EXISTS profile_extra (';
    query += 'profile_id INTEGER NOT NULL,';
    query += 'name VARCHAR(255) NOT NULL,';
    query += 'value TEXT,';
    query += 'PRIMARY KEY(profile_id, name)'
    query += ');';
    return db.run(query); 
  });
}

function uninstall(){
  return new Promise(function(resolve, reject){
      db.run("DROP TABLE IF EXISTS profile", function(err, row){
          if(err){
              reject(err);
          }
          resolve(row);
      });
      
  })
  .then(function(){
    return new Promise(function(resolve, reject){
      db.run("DROP TABLE IF EXISTS profile_extra", function(err, row){
          if(err){
              reject(err);
          }
          resolve(row);
      });
    });
  });
}

function getProfileByUsername(username){
    return new Promise(function(resolve, reject){
        db.get("SELECT * FROM profile WHERE username = ?", username, function(err, row){
            if(err){
                reject(err);
            }
            resolve(row);
        });
        
    });
}

function getProfileById(id){
    return new Promise(function(resolve, reject){
        db.get("SELECT * FROM profile WHERE id = ?", id, function(err, row){
            if(err){
                reject(err);
            }
            resolve(row);
        });
    });
}

function getProfileExtra(id){
  return new Promise(function(resolve, reject){
      db.all("SELECT name, value FROM profile_extra WHERE profile_id = ?", id, function(err, rows){
          if(err){
              reject(err);
          }
          resolve(rows);
      });
  })
  .then(function(rows){
    let extra = {"id": id};
    rows.forEach((row) => {
      extra[row.name] = row.value;
    });

    return extra;
  });
}

function createProfile(profile){
  return new Promise(function(resolve, reject){
    const hash = crypto.createHash('sha256');
    profile.salt = randomstring.generate(8);

    hash.update(profile.password + profile.salt);
    profile.hashedPassword = hash.digest('base64');
    
    db.get("SELECT username FROM profile WHERE username = ?", profile.username, function(err, row){
        if(row){
            reject('Duplicate user');
        }
        resolve();
    });
  })
  .then(function(){
    var stmt = db.prepare("INSERT INTO profile(username, email, password, salt) VALUES (?, ?, ?, ?)");
    stmt.run(profile.username, profile.email, profile.hashedPassword, profile.salt, function(err){
        if(err){
          console.log(err); 
          throw new Error(err); 
        }
    });
    return stmt.finalize();
  });
}

function updatePassword(prof, pass){
  const hash = crypto.createHash('sha256');
  hash.update(pass + prof.salt);
  var hashedPassword = hash.digest('base64');
  let sql = 'UPDATE profile SET password = ? WHERE id = ?;';
  return new Promise(function(resolve, reject){
    db.run(sql, hashedPassword, prof.id, function(err){
      if(err){
        reject(err);
      }
      resolve();
    });
  });
}

function updateProfileExtra(id, extra){
  let rows = [];
  Object.keys(extra).forEach(function(key){
    rows.push({
      $profile_id: id,
      $name: key,
      $value: extra[key] 
    });
  });

  let sql = 'INSERT OR REPLACE INTO profile_extra (profile_id, name, value)';
  sql    += 'VALUES($profile_id, $name, $value);';
  return new Promise(function(resolve, reject){
    rows.forEach(function(row){
        db.run(sql, row, function(err) {
          if (err) {
            reject(err);
          }
        });
      resolve();  
    });
  });
}

function authenticateUser(username, pass){
  return getProfileByUsername(username)
  .then(function(userProfile){
    if(userProfile == undefined){
        return res.status(401).json({
            msg: "Authorization unsuccessful. User " + username + " doesn't exist.",
            success: false
        });
    }

    const hash = crypto.createHash('sha256');

    hash.update(pass + userProfile.salt);
    var hashedPassword = hash.digest('base64');

    if(hashedPassword === userProfile.password){
        return userProfile;
    }
    else{
        return false;
    }
  })
  .catch(function(err){
      console.log(err);
      return false;
  });
}

// Only show fields we want visible on the front end.
function filterExtra(extra){
  let ret = {};
  let validFieldNames = getValidFieldNames();
  Object.keys(extra).forEach(function(key){
    if(validFieldNames.indexOf(key) != -1){
      ret[key] = extra[key];
    }
  });

  return ret;
}

function getValidFieldNames(){
  return [
    'favorite color',
    'favorite band',
    'hours spent asleep in elevator'
  ];
}

module.exports = {
  install: install,
  uninstall: uninstall,
  getProfileByUsername: getProfileByUsername,
  getProfileById: getProfileById,
  getProfileExtra: getProfileExtra,
  createProfile: createProfile,
  updateProfileExtra: updateProfileExtra,
  getValidFieldNames: getValidFieldNames,
  filterExtra: filterExtra,
  authenticateUser: authenticateUser,
  updatePassword: updatePassword
};