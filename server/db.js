const moment = require("moment");
var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "test",
});
//saving data
module.exports.savedata = async ({
  
  Primary_image,
  Secondary_image,
  text_1,
  text_2,
  topImage,
  bottomImage,
  Latitude,
  Longitude,
  trip_id,
  model_type,
  Datetime
}) => {
  const dateTimeSql = moment(Datetime).format('YYYY-MM-DD HH:mm:ss');
  const query = `
  insert into 
  tripper (Date_time,Primary_image,Secondary_image,text_1 ,text_2,topImage,bottomImage,Latitude,Longitude,trip_id,model_type) 
  VALUES ('${dateTimeSql}','${Primary_image}', '${Secondary_image}','${text_1}','${text_2}','${topImage}','${bottomImage}',${Latitude},${Longitude},${trip_id},'${model_type}');
`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
      console.log(error, results, fields);
      if (error) reject();

      console.log("The solution is: ", results);
      resolve(results);
    });
  });
};
module.exports.savegmmdata = async ({
  
  Primary_image,
  text_1,
  text_2,
  time

}) => {
  const dateTimeSql = moment(time).format('YYYY-MM-DD HH:mm:ss');
  const query = `
  insert into 
  GNS (Date_time,Primary_image,text_1 ,text_2) 
  VALUES ( '${dateTimeSql}','${Primary_image}','${text_1}','${text_2}');
`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
      console.log(error, results, fields);
      if (error) reject();

      console.log("The solution is: ", results);
      resolve(results);
    });
  });
};
module.exports.saveG_maps = async ({
  
  Primary_image,
  text_1,
  text_2,
  time

}) => {
  const dateTimeSql = moment(time).format('YYYY-MM-DD HH:mm:ss');
  const query = `
  insert into 
  G_maps (Date_time,Primary_image,text_1 ,text_2) 
  VALUES ( '${dateTimeSql}','${Primary_image}','${text_1}','${text_2}');
`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
      console.log(error, results, fields);
      if (error) reject();

      console.log("The solution is: ", results);
      resolve(results);
    });
  });
};

// for the kdash images to be stored
module.exports.saveKdashdata = async ({
  trip_id,
  data: Image,
  Datetime
}) => {
  try{
  const dateTimeSql = moment(Datetime).format('YYYY-MM-DD HH:mm:ss');
  const query = `
  insert into 
  kdash_raw (Time_stamp,Image,trip_id)
  VALUES ('${dateTimeSql}','${Image}','${trip_id}');`
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
      // console.log(error, results, fields);
      if (error) reject(error);

      // console.log("The solution is: ", results);
      resolve(results);
    });
  });

}catch(err){
  console.log('#err ',err);
}
};


connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);

});


// chage the tables when need for tripper use
const createTrip = async (trip_name) => {
  const query = `
  insert into 
  trip_details_kdash (trip_name) 
  VALUES ('${trip_name}');
  
`;

  return new Promise((resolve, reject) => {
    connection.query(query, (error, results, fields) => {
      console.log(error, results, fields);
      if (error) reject();

      console.log("The solution is: ",results.insertId );
      resolve({
        success: results.affectedRows == 1,
        trip_id:results.insertId
      });
    });
  });
};


module.exports.createTrip = createTrip