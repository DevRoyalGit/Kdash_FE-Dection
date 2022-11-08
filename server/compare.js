const MODES = {
  TRIPPER_TO_METADATA: "TRIPPER_TO_METADATA", //done
  TRIPPER_TO_GMM: "TRIPPER_TO_GMM",//done
  TRIPPER_TO_GNS: "TRIPPER_TO_GNS",
  METADATA_TO_GMM: "METADATA_TO_GMM",
  METADATA_TO_GNS: "METADATA_TO_GNS",
};

//change here to change the validation  mode
const CURRENT_MODE = MODES.METADATA_TO_GMM;

const TABLES = {
  TRIPPER: "tripper",
  GMAPS: "G_maps",
  GNS: "GNS",
  METADATA: "metadata",
  COMPARE: "compare",
  TRIPDETAILS: "trip_details",
};

//Compare Tripper with metadata
//Compare Tripper with gmm/gns

//compare metadata -> gmm/gns
console.log("STARTING DETECT");
const moment = require("moment");
const TABLE = "G_maps"; // need to chage wen verifying

var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "test",
});

connection.connect(async (err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);
  main()
    .then(() => {
      console.log("Successful Execution");
      process.exit(1);
    })
    .catch((err) => {
      console.log("Failed Execution", err);
      process.exit(-1);
    });
});

const main = async () => {
  const options = {
    [MODES.TRIPPER_TO_METADATA]: compareTripperWithMetadata,
    [MODES.TRIPPER_TO_GMM]: compareTripperWithGMM,//proper testing
    [MODES.TRIPPER_TO_GNS]: compareTripperWithGNS,
    [MODES.METADATA_TO_GMM]: compareMetadataWithGMM,//test
    [MODES.METADATA_TO_GNS]: compareMetadataWithGNS,//test
  };

  await options?.[CURRENT_MODE]?.();
};

const compareMetadataWithGMM = async () => {
  const TT = TABLES.GMAPS;
  const query = `
  select * from ${TABLES.METADATA} where is_verified =  false; 
`;

  return new Promise((resolve) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      // results = results.slice(0,8)
      for (let i of results) {
        console.log(i.id);
        try {
          const time = i["Start_Time"];
          const tripperPrediction = i["Prim_man_Desc"];
          const timeString = moment(time).format("YYYY-MM-DD HH:mm:ss");

          const queryNextTime = `
         SELECT * FROM ${TT} 
         WHERE Date_time >= '${timeString}'
         ORDER BY Date_time ASC
         LIMIT 1;
    `;

          const queryPrevTime = `
        SELECT * FROM ${TT} 
        WHERE Date_time <= '${timeString}'
        ORDER BY Date_time DESC
        LIMIT 1;
    `;

          const res = await new Promise((resolve, reject) => {
            try {
              connection.query(
                queryNextTime,
                async (error, resultsN, fields) => {
                  if (error) throw new Error(error.message);
                  connection.query(
                    queryPrevTime,
                    async (error, resultsP, fields) => {
                      if (error) throw new Error(error.message);
                      
                      const nearRow = calculate(
                        time,
                        resultsN[0],
                        resultsP[0],
                
                      );
                      if (nearRow) {
                        const googlePrediction = nearRow["Primary_image"];
                        console.log("###NEAR ", nearRow.id, tripperPrediction);
                        const isValid = isMatch(
                          tripperPrediction,
                          googlePrediction
                        );

                        //-1 = failure
                        resolve({
                          row: nearRow,
                          valid: isValid,
                        });
                      } else {
                        //this happens when there is no matching timestamp in GMM table (within mentioned margin)
                        //console.log("###", index, timeString, "NO MATCH");
                        reject("no match");
                      }
                    }
                  );
                }
              );
            } catch (err) {
              reject(err.message);
            }
          });

          console.log("###RES : ",  res.valid);
          await storeToCompare(true, i, res.row, res.valid);
          currentIndex += 1;
        } catch (err) {
          console.log('##ee',err);
        }
      }
      resolve(true);
    });
  });
};

const compareMetadataWithGNS = async () => {
  const TT = TABLES.GNS;
  const query = `
  select * from ${TABLES.METADATA} where is_verified =  false; 
`;

  return new Promise((resolve) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      // results = results.slice(0,8)
      for (let i of results) {
        console.log(i.id);
        try {
          const time = i["Start_Time"];
          const tripperPrediction = i["Prim_man_Desc"];
          const timeString = moment(time).format("YYYY-MM-DD HH:mm:ss");

          const queryNextTime = `
         SELECT * FROM ${TT} 
         WHERE Date_time >= '${timeString}'
         ORDER BY Date_time ASC
         LIMIT 1;
    `;

          const queryPrevTime = `
        SELECT * FROM ${TT} 
        WHERE Date_time <= '${timeString}'
        ORDER BY Date_time DESC
        LIMIT 1;
    `;

          const res = await new Promise((resolve, reject) => {
            try {
              connection.query(
                queryNextTime,
                async (error, resultsN, fields) => {
                  if (error) throw new Error(error.message);
                  connection.query(
                    queryPrevTime,
                    async (error, resultsP, fields) => {
                      if (error) throw new Error(error.message);
                      
                      const nearRow = calculate(
                        time,
                        resultsN[0],
                        resultsP[0], 
                      );
                      if (nearRow) {
                        const googlePrediction = nearRow["Primary_image"];
                        console.log("###NEAR ", nearRow.id, tripperPrediction);
                        const isValid = isMatch(
                          tripperPrediction,
                          googlePrediction
                        );

                        //-1 = failure
                        resolve({
                          row: nearRow,
                          valid: isValid,
                        });
                      } else {
                        //this happens when there is no matching timestamp in GMM table (within mentioned margin)
                        //console.log("###", index, timeString, "NO MATCH");
                        reject("no match");
                      }
                    }
                  );
                }
              );
            } catch (err) {
              reject(err.message);
            }
          });

          console.log("###RES : ",  res.valid);
          await storeToCompare(true, i, res.row, res.valid);
          currentIndex += 1;
        } catch (err) {
          console.log('##ee',err);
        }
      }
      resolve(true);
    });
  });
};

const calculate = (tripper_time, gmm_next, gmm_prev) => {
  //find nearest field in gmm
  const next_time = gmm_next?.["Date_time"];
  const prev_time = gmm_prev?.["Date_time"];

  const diffInNext = next_time
    ? moment(tripper_time).diff(moment(next_time), "milliseconds")
    : undefined;
  const diffInPrev = prev_time
    ? moment(tripper_time).diff(moment(prev_time), "milliseconds")
    : undefined;

  let nearRow, diff;
  if (diffInNext < diffInPrev) {
    nearRow = gmm_next;
    diff = moment(tripper_time).diff(moment(next_time), "seconds");
  } else {
    nearRow = gmm_prev;
    diff = moment(tripper_time).diff(moment(prev_time), "seconds");
  }


  if (diff <= 2000) {
    return nearRow;
  } else return null;
};

const compareTripperWithGMM = async (_, index) => {
  const TT = TABLES.GMAPS;
  const query = `
    select * from ${TABLES.TRIPPER} where is_verified =  false; 
  `;

  return new Promise((resolve,reject) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      // results = results.slice(0,8)
      for (let i of results) {
        try {
          const time = i["Date_time"];
          const tripperPrediction = i["Primary_image"];
          const timeString = moment(time).format("YYYY-MM-DD HH:mm:ss");

          const queryNextTime = `
         SELECT * FROM ${TT} 
         WHERE Date_time >= '${timeString}'
         ORDER BY Date_time ASC
         LIMIT 1;
    `;

          const queryPrevTime = `
        SELECT * FROM ${TT} 
        WHERE Date_time <= '${timeString}'
        ORDER BY Date_time DESC
        LIMIT 1;
    `;

          const res = await new Promise((resolve, reject) => {
            try {
              connection.query(
                queryNextTime,
                async (error, resultsN, fields) => {
                
                  if (error) throw new Error(error.message);
                
                  connection.query(
                    queryPrevTime,
                    async (error, resultsP, fields) => {
                      
                      if (error) throw new Error(error.message);
                      
                      const nearRow = calculate(
                        time,
                        resultsN[0],
                        resultsP[0],
               
                      );
                      if (nearRow) {
                        const googlePrediction = nearRow["Primary_image"];
                        console.log("###NEAR ", nearRow.id, tripperPrediction);
                        const isValid = isMatch(
                          tripperPrediction,
                          googlePrediction
                        );

                        //-1 = failure
                        resolve({
                          row: nearRow,
                          valid: isValid,
                        });
                      } else {
                        //this happens when there is no matching timestamp in GMM table (within mentioned margin)
                        //console.log("###", index, timeString, "NO MATCH");
                        reject("no match");
                      }
                    }
                  );
                }
              );
            } catch (err) {
              reject(err.message);
            }
          });
         
          console.log("###RESS ",i.id, res.valid);
          await storeToCompare(true, i, res.row, res.valid);
        } catch (err) {
          console.log('##CC ',err);
         }
      }
      resolve(true);
    });
  });
};

const compareTripperWithGNS = async (_, index) => {
  const TT = TABLES.GNS;
  const query = `
    select * from ${TABLES.TRIPPER} where is_verified =  false; 
  `;

  return new Promise((resolve,reject) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      // results = results.slice(0,8)
      for (let i of results) {
        try {
          const time = i["Date_time"];
          const tripperPrediction = i["Primary_image"];
          const timeString = moment(time).format("YYYY-MM-DD HH:mm:ss");

          const queryNextTime = `
         SELECT * FROM ${TT} 
         WHERE Date_time >= '${timeString}'
         ORDER BY Date_time ASC
         LIMIT 1;
    `;

          const queryPrevTime = `
        SELECT * FROM ${TT} 
        WHERE Date_time <= '${timeString}'
        ORDER BY Date_time DESC
        LIMIT 1;
    `;

          const res = await new Promise((resolve, reject) => {
            try {
              connection.query(
                queryNextTime,
                async (error, resultsN, fields) => {
            
                  if (error) throw new Error(error.message);
                
                  connection.query(
                    queryPrevTime,
                    async (error, resultsP, fields) => {
                      
                      if (error) throw new Error(error.message);
                      
                      const nearRow = calculate(
                        time,
                        resultsN[0],
                        resultsP[0],
                      );
                      if (nearRow) {
                        const googlePrediction = nearRow["Primary_image"];
                        console.log("###NEAR ", nearRow.id, tripperPrediction);
                        const isValid = isMatch(
                          tripperPrediction,
                          googlePrediction
                        );

                        //-1 = failure
                        resolve({
                          row: nearRow,
                          valid: isValid,
                        });
                      } else {
                        //this happens when there is no matching timestamp in GMM table (within mentioned margin)
                        //console.log("###", index, timeString, "NO MATCH");
                        reject("no match");
                      }
                    }
                  );
                }
              );
            } catch (err) {
              reject(err.message);
            }
          });
         
          console.log("###RESS ",i.id, res.valid);
          await storeToCompare(true, i, res.row, res.valid);
        } catch (err) {
          console.log('##CC ',err);
         }
      }
      resolve(true);
    });
  });
};

const compareTripperWithMetadata = async (_, index) => {
  const query = `
      select * from ${TABLES.TRIPPER} where is_verified =  false; 
    `;

  return new Promise((resolve) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      // results = results.slice(0,8)
      for (let i of results) {
        const time = i["Date_time"];
        const tripperPrediction = i["Primary_image"];
        const timeString = moment(time).format("YYYY-MM-DD HH:mm:ss");
        console.log(timeString, tripperPrediction, i.id);

        const queryNextTime = `
         SELECT * FROM metadata
         WHERE Start_Time >= '${timeString}'
         ORDER BY Start_Time ASC
         LIMIT 1;
    `;

        const queryPrevTime = `
        SELECT * FROM metadata 
        WHERE Start_Time <= '${timeString}'
        ORDER BY Start_Time DESC
        LIMIT 1;
    `;

        const res = await new Promise((resolve, reject) => {
          try {
            connection.query(queryNextTime, async (error, resultsN, fields) => {
              if (error) throw new Error(error.message);
              connection.query(
                queryPrevTime,
                async (error, resultsP, fields) => {
                  if (error) throw new Error(error.message);

                  const nearRow = calculate(
                    time,
                    resultsN[0],
                    resultsP[0],
            
                  );
                  if (nearRow) {
                    const googlePrediction = nearRow["Primary_image"];
                    console.log("###NEAR ", nearRow.id, tripperPrediction);
                    const isValid = isMatch(
                      tripperPrediction,
                      googlePrediction
                    );

                    resolve({
                      row: nearRow,
                      valid: isValid,
                    });
                  } else {
                    //this happens when there is no matching timestamp in GMM table (within mentioned margin)
                    //console.log("###", index, timeString, "NO MATCH");
                    reject("no match");
                  }
                }
              );
            });
          } catch (err) {
            reject(err.messgae);
          }
        });
        console.log("###RES ", res);
        await storeToCompare(true, i, res.row, res.valid);
      }
    });
  });
};

const updateDB = async ({ id, google, meta }) => {
  const query = `update tripper set  Match_field = ${google}, meta_data_id = ${meta}  WHERE  id = ${id};`;
  connection.query(query, async (error, results, fields) => {
    if (error) throw new Error(error.message);
    console.log(id);
  });
};

const isMatch = (tripper, gmm) => {
  // Keys in MATCHES object are the labels of GMM, values are matching TRIPPER Table image label
  const MATCHES = {
    DEPART: [
      "DEPART",
      "DEPART_0",
      "DEPART_1",
      "DEPART_2",
      "DEPART_3",
      "DEPART_4",
      "DEPART_5",
      "DEPART_6",
    ],
    DESTINATION: ["Destination"],
    DESTINATION_LEFT: ["DESTINATION_LEFT"],
    FERRY_BOAT: [
      "FERRY",
      "FERRY_0",
      "FERRY_1",
      "FERRY_2",
      "FERRY_3",
      "FERRY_4",
      "FERRY_5",
      "FERRY_6",
    ],
    DESTINATION_RIGHT: ["Destination_right"],
    TURN_LEFT: [
      "Turn_Left",
      "Turn_Left_0",
      "Turn_Left_1",
      "Turn_Left_10",
      "Turn_Left_6",
      "Turn_Left_7",
      "Turn_Left_8",
      "Turn_Left_9",
      "Turn_Right",
      "Turn_Right_0",
      "Turn_Right_11",
      "Turn_Right_12",
      "Turn_Right_13",
      "Turn_Right_14",
      "Turn_Right_15",
      "Turn_Right_16",
    ],
    TURN_RIGHT: [
      "Turn_Right",
      "Turn_Right_0",
      "Turn_Right_11",
      "Turn_Right_12",
      "Turn_Right_13",
      "Turn_Right_14",
      "Turn_Right_15",
      "Turn_Right_16",
    ],
    TURN_SLIGHT_LEFT: [
      "off_ramp_slight_left",
      "off_ramp_slight_left_0",
      "off_ramp_slight_left_1",
      "off_ramp_slight_left_2",
      "off_ramp_slight_left_3",
      "off_ramp_slight_left_4",
      "off_ramp_slight_left_5",
      "off_ramp_slight_left_6",
    ],
    STRAIGHT: [
      "Straight",
      "Straight_1",
      "Straight_10",
      "Straight_5",
      "Straight_6",
      "Straight_7",
      "Straight_8",
      "Straight_9",
    ],
    MERGE_LEFT: [
      "Merge Left",
      "Merge Left_0",
      "Merge Left_1",
      "Merge Left_2",
      "Merge Left_3",
      "Merge Left_4",
      "Merge Left_5",
      "Merge Left_6",
    ],
    MERGE_UNSPECIFIED: ["MERGE_UNSPECIFIED"],
    // clock wise in left
    //cpunterclockwise in right
    ROUNDABOUT_SLIGHT_RIGHT_COUNTERCLOCKWISE: [
      "Round_ABOUT_RIGHT_0",
      "Round_ABOUT_RIGHT_1",
      "Round_ABOUT_RIGHT_2",
      "Round_ABOUT_RIGHT_3",
      "Round_ABOUT_RIGHT_4",
      "Round_ABOUT_RIGHT_5",
      "Round_ABOUT_RIGHT_6",
      "Round_ABOUT_RIGHT",
      "ROUNDABOUT_SHARP_RIGHT_COUNTERCLOCKWISE",
      "ROUNDABOUT_SLIGHT_RIGHT_COUNTERCLOCKWISE",
      "ROUNDABOUT_SLIGHT_RIGHT_COUNTERCLOCKWISE",
      "ROUNDABOUT_SLIGHT_LEFT_COUNTERCLOCKWISE",
      "ROUNDABOUT_LEFT_COUNTERCLOCKWISE",
      "ROUNDABOUT_SHARP_LEFT_COUNTERCLOCKWISE",
      "ROUNDABOUT_U_TURN_COUNTERCLOCKWISE",
      "ROUNDABOUT_COUNTERCLOCKWISE",
      "ROUNDABOUT_EXIT_COUNTERCLOCKWISE",
    ],
    ROUNDABOUT_SLIGHT_LEFT_CLOCKWISE: [
      "Roundabout (without exit number)_0",
      "Roundabout (without exit number)_1,",
      "Roundabout (without exit number)_2",
      "Roundabout (without exit number)_3",
      "Roundabout (without exit number)_4",
      "Roundabout (without exit number)_5",
      "Roundabout (without exit number)_6",
      "Roundabout (without exit number)",
      "ROUNDABOUT_SHARP_RIGHT_CLOCKWISE",
      "ROUNDABOUT_RIGHT_CLOCKWISE",
      "ROUNDABOUT_SLIGHT_RIGHT_CLOCKWISE",
      "ROUNDABOUT_STRAIGHT_CLOCKWISE",
      "ROUNDABOUT_SLIGHT_LEFT_CLOCKWISE",
      "ROUNDABOUT_LEFT_CLOCKWISE",
      "ROUNDABOUT_SHARP_LEFT_CLOCKWISE",
      "ROUNDABOUT_U_TURN_CLOCKWISE",
      "ROUNDABOUT_CLOCKWISE",
      "ROUNDABOUT_EXIT_CLOCKWISE",
    ],
    FORK_LEFT: ["Keep_Left", "Keep_Left_1", "Keep_Left_2", "Keep_Left_3"],
    TURN_SLIGHT_RIGHT: [
      "Slight_Left",
      "Slight_Left_0",
      "Slight_Left_1",
      "Slight_Left_4",
      "Slight_Left_5",
      "Slight_Left_6",
      "Slight_Left_7",
      "Slight_Left_8",
      "Slight_Right_1",
      "Slight_Right_4",
      "Slight_Right_5",
      "Slight_Right_6",
      "Slight_Right_7",
      "Slight_Right_8",
    ],
  };

  const isValid = MATCHES?.[gmm]?.includes(tripper);
  return isValid;
};

const storeToCompare = async (isTripper, t1, t2, result) => {
  //tripper
  const {
    id,
    Date_time,
    Primary_image,
    Secondary_image,
    //metadata
    Start_Time,
    Prim_man_Descr,
    Sec_man_Descr,
  } = t1 || {};

  const {
    //gmm
    id: t2Id,
    Primary_image: t2PrimaryImage,
    //metadata
    Prim_man_Descr: t2Prim_man_Descre,
  } = t2 || {};

  const datetime = moment(Date_time || Start_Time).format(
    "YYYY-MM-DD HH:mm:ss"
  );

  try {
    const query1 = `
    update ${
      isTripper ? TABLES.TRIPPER : TABLES.METADATA
    } set is_verified = true WHERE  id = ${id};`;

    const query2 = `insert into 
    ${TABLES.COMPARE} (
      Date_time,
      Comparion_Type,
      Primary_image_1,
      Primary_image_2,
      Secondary_image ,
      t1_id , 
      t2_id,
      Result
    ) 
    VALUES (
      '${datetime}',
      '${CURRENT_MODE}', 
      '${Primary_image ?? Prim_man_Descr}',
      '${t2PrimaryImage ?? t2Prim_man_Descre}',
      '${Secondary_image ?? Sec_man_Descr}',
      ${id},
      ${t2Id},
      ${!!result}
    );
  `;

    connection.query(query1, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      connection.query(query2, async (error, results, fields) => {
        if (error) throw new Error(error.message);
      });
    });
  } catch (err) {}
};

const SYMBOLS_DAY = {
  0: "Battery_low",
  1: "DEPART",
  2: "DEPART_0",
  3: "DEPART_1",
  4: "DEPART_2",
  5: "DEPART_3",
  6: "DEPART_4",
  7: "DEPART_5",
  8: "DEPART_6",
  9: "Destination",
  10: "Destination_left",
  11: "Destination_right",
  12: "FERRY",
  13: "FERRY_0",
  14: "FERRY_1",
  15: "FERRY_2",
  16: "FERRY_3",
  17: "FERRY_4",
  18: "FERRY_5",
  19: "FERRY_6",
  20: "FERRY_TRAIN",
  21: "FERRY_TRAIN_0",
  22: "FERRY_TRAIN_1",
  23: "FERRY_TRAIN_2",
  24: "FERRY_TRAIN_3",
  25: "FERRY_TRAIN_4",
  26: "FERRY_TRAIN_5",
  27: "FERRY_TRAIN_6",
  28: "Keep_Left",
  29: "Keep_Left_1",
  30: "Keep_Left_2",
  31: "Keep_Left_3",
  32: "Keep_Right",
  33: "Keep_Right_1",
  34: "Keep_Right_2",
  35: "Keep_Right_3",
  36: "Left_Curve",
  37: "Merge Left",
  38: "Merge Left_0",
  39: "Merge Left_1",
  40: "Merge Left_2",
  41: "Merge Left_3",
  42: "Merge Left_4",
  43: "Merge Left_5",
  44: "Merge Left_6",
  45: "Merge Right",
  46: "Merge Right_0",
  47: "Merge Right_1",
  48: "Merge Right_2",
  49: "Merge Right_3",
  50: "Merge Right_4",
  51: "Merge Right_5",
  52: "Merge Right_6",
  53: "ONRAMP_LEFT",
  54: "ONRAMP_LEFT_0",
  55: "ONRAMP_LEFT_1",
  56: "ONRAMP_LEFT_2",
  57: "ONRAMP_LEFT_3",
  58: "ONRAMP_LEFT_4",
  59: "ONRAMP_LEFT_5",
  60: "ONRAMP_LEFT_6",
  61: "ONRAMP_RIGHT",
  62: "ONRAMP_RIGHT_0",
  63: "ONRAMP_RIGHT_1",
  64: "ONRAMP_RIGHT_2",
  65: "ONRAMP_RIGHT_3",
  66: "ONRAMP_RIGHT_4",
  67: "ONRAMP_RIGHT_5",
  68: "ONRAMP_RIGHT_6",
  69: "ONRAMP_SHARP_LEFT",
  70: "ONRAMP_SHARP_LEFT_0",
  71: "ONRAMP_SHARP_LEFT_1",
  72: "ONRAMP_SHARP_LEFT_2",
  73: "ONRAMP_SHARP_LEFT_3",
  74: "ONRAMP_SHARP_LEFT_4",
  75: "ONRAMP_SHARP_LEFT_5",
  76: "ONRAMP_SHARP_LEFT_6",
  77: "ONRAMP_SHARP_RIGHT",
  78: "ONRAMP_SHARP_RIGHT_0",
  79: "ONRAMP_SHARP_RIGHT_1",
  80: "ONRAMP_SHARP_RIGHT_2",
  81: "ONRAMP_SHARP_RIGHT_3",
  82: "ONRAMP_SHARP_RIGHT_4",
  83: "ONRAMP_SHARP_RIGHT_5",
  84: "ONRAMP_SHARP_RIGHT_6",
  85: "ONRAMP_SLIGHT_LEFT",
  86: "ONRAMP_SLIGHT_LEFT_0",
  87: "ONRAMP_SLIGHT_LEFT_1",
  88: "ONRAMP_SLIGHT_LEFT_2",
  89: "ONRAMP_SLIGHT_LEFT_3",
  90: "ONRAMP_SLIGHT_LEFT_4",
  91: "ONRAMP_SLIGHT_LEFT_5",
  92: "ONRAMP_SLIGHT_LEFT_6",
  93: "ONRAMP_SLIGHT_RIGHT",
  94: "ONRAMP_SLIGHT_RIGHT_0",
  95: "ONRAMP_SLIGHT_RIGHT_1",
  96: "ONRAMP_SLIGHT_RIGHT_2",
  97: "ONRAMP_SLIGHT_RIGHT_3",
  98: "ONRAMP_SLIGHT_RIGHT_4",
  99: "ONRAMP_SLIGHT_RIGHT_5",
  100: "ONRAMP_SLIGHT_RIGHT_6",
  101: "ON_RAMP",
  102: "ON_RAMP_0",
  103: "ON_RAMP_1",
  104: "ON_RAMP_2",
  105: "ON_RAMP_3",
  106: "ON_RAMP_4",
  107: "ON_RAMP_5",
  108: "ON_RAMP_6",
  109: "Round_ABOUT_RIGHT",
  110: "Round_ABOUT_RIGHT_0",
  111: "Round_ABOUT_RIGHT_1",
  112: "Round_ABOUT_RIGHT_2",
  113: "Round_ABOUT_RIGHT_3",
  114: "Round_ABOUT_RIGHT_4",
  115: "Round_ABOUT_RIGHT_5",
  116: "Round_ABOUT_RIGHT_6",
  117: "Roundabout -without exit number-",
  118: "Roundabout -without exit number-_0",
  119: "Roundabout -without exit number-_1",
  120: "Roundabout -without exit number-_2",
  121: "Roundabout -without exit number-_3",
  122: "Roundabout -without exit number-_4",
  123: "Roundabout -without exit number-_5",
  124: "Roundabout -without exit number-_6",
  125: "Slight_Left",
  126: "Slight_Left_0",
  127: "Slight_Left_1",
  128: "Slight_Left_4",
  129: "Slight_Left_5",
  130: "Slight_Left_6",
  131: "Slight_Left_7",
  132: "Slight_Left_8",
  133: "Slight_Right_1",
  134: "Slight_Right_4",
  135: "Slight_Right_5",
  136: "Slight_Right_6",
  137: "Slight_Right_7",
  138: "Slight_Right_8",
  139: "Straight",
  140: "Straight_1",
  141: "Straight_10",
  142: "Straight_5",
  143: "Straight_6",
  144: "Straight_7",
  145: "Straight_8",
  146: "Straight_9",
  // "147": "Tripper_pod",
  148: "Turn_Left",
  149: "Turn_Left_0",
  150: "Turn_Left_1",
  151: "Turn_Left_10",
  152: "Turn_Left_6",
  153: "Turn_Left_7",
  154: "Turn_Left_8",
  155: "Turn_Left_9",
  156: "Turn_Right",
  157: "Turn_Right_0",
  158: "Turn_Right_11",
  159: "Turn_Right_12",
  160: "Turn_Right_13",
  161: "Turn_Right_14",
  162: "Turn_Right_15",
  163: "Turn_Right_16",
  164: "Warning_rerouting",
  165: "fork_sharp_left",
  166: "fork_sharp_left_0",
  167: "fork_sharp_left_1",
  168: "fork_sharp_left_2",
  169: "fork_sharp_left_3",
  170: "fork_sharp_left_4",
  171: "fork_sharp_left_5",
  172: "fork_sharp_left_6",
  173: "fork_sharp_right",
  174: "fork_sharp_right_0",
  175: "fork_sharp_right_1",
  176: "fork_sharp_right_2",
  177: "fork_sharp_right_3",
  178: "fork_sharp_right_4",
  179: "fork_sharp_right_5",
  180: "fork_sharp_right_6",
  181: "fork_slight_left",
  182: "fork_slight_left_0",
  183: "fork_slight_left_1",
  184: "fork_slight_left_2",
  185: "fork_slight_left_3",
  186: "fork_slight_left_4",
  187: "fork_slight_left_5",
  188: "fork_slight_left_6",
  189: "fork_slight_right",
  190: "fork_slight_right_0",
  191: "fork_slight_right_1",
  192: "fork_slight_right_2",
  193: "fork_slight_right_3",
  194: "fork_slight_right_4",
  195: "fork_slight_right_5",
  196: "fork_slight_right_6",
  197: "marinara sauce",
  198: "merge_sharp_left",
  199: "merge_sharp_left_0",
  200: "merge_sharp_left_1",
  201: "merge_sharp_left_2",
  202: "merge_sharp_left_3",
  203: "merge_sharp_left_4",
  204: "merge_sharp_left_5",
  205: "merge_sharp_left_6",
  206: "merge_sharp_right",
  207: "merge_sharp_right_0",
  208: "merge_sharp_right_1",
  209: "merge_sharp_right_2",
  210: "merge_sharp_right_3",
  211: "merge_sharp_right_4",
  212: "merge_sharp_right_5",
  213: "merge_sharp_right_6",
  214: "merge_slight_left",
  215: "merge_slight_left_0",
  216: "merge_slight_left_1",
  217: "merge_slight_left_2",
  218: "merge_slight_left_3",
  219: "merge_slight_left_4",
  220: "merge_slight_left_5",
  221: "merge_slight_left_6",
  222: "merge_slight_right",
  223: "merge_slight_right_0",
  224: "merge_slight_right_1",
  225: "merge_slight_right_2",
  226: "merge_slight_right_3",
  227: "merge_slight_right_4",
  228: "merge_slight_right_5",
  229: "merge_slight_right_6",
  230: "off_ramp_sharp_left",
  231: "off_ramp_sharp_left_0",
  232: "off_ramp_sharp_left_1",
  233: "off_ramp_sharp_left_2",
  234: "off_ramp_sharp_left_3",
  235: "off_ramp_sharp_left_4",
  236: "off_ramp_sharp_left_5",
  237: "off_ramp_sharp_left_6",
  238: "off_ramp_sharp_right",
  239: "off_ramp_sharp_right_0",
  240: "off_ramp_sharp_right_1",
  241: "off_ramp_sharp_right_2",
  242: "off_ramp_sharp_right_3",
  243: "off_ramp_sharp_right_4",
  244: "off_ramp_sharp_right_5",
  245: "off_ramp_sharp_right_6",
  246: "off_ramp_slight_left",
  247: "off_ramp_slight_left_0",
  248: "off_ramp_slight_left_1",
  249: "off_ramp_slight_left_2",
  250: "off_ramp_slight_left_3",
  251: "off_ramp_slight_left_4",
  252: "off_ramp_slight_left_5",
  253: "off_ramp_slight_left_6",
  254: "off_ramp_slight_right",
  255: "off_ramp_slight_right_0",
  256: "off_ramp_slight_right_1",
  257: "off_ramp_slight_right_2",
  258: "off_ramp_slight_right_3",
  259: "off_ramp_slight_right_4",
  260: "off_ramp_slight_right_5",
  261: "off_ramp_slight_right_6",
  264: "uTurn_Left",
  265: "uTurn_Left_2",
  266: "uTurn_Left_3",
  267: "uTurn_Left_4",
  268: "uTurn_Left_5",
  269: "uTurn_Left_6",
  270: "uTurn_Right",
  271: "uTurn_Right_0",
  272: "uTurn_Right_1",
  273: "uTurn_Right_2",
  274: "uTurn_Right_3",
  275: "uTurn_Right_4",
  276: "uTurn_Right_5",
  277: "uTurn_Right_6",
  278: "uTurn_left_0",
  279: "uTurn_left_1",
  280: "uTurn_right",
};

const SYMBOLS_NIGHT = {
  0: "DEPART_1",
  1: "DEPART_2",
  2: "DEPART_3",
  3: "DEPART_4",
  4: "DEPART_5",
  5: "DEPART_6",
  6: "Destination",
  7: "Destination_left",
  8: "Destination_right",
  9: "FERRY_1",
  10: "FERRY_2",
  11: "FERRY_3",
  12: "FERRY_4",
  13: "FERRY_5",
  14: "FERRY_6",
  15: "FERRY_TRAIN_1",
  16: "FERRY_TRAIN_2",
  17: "FERRY_TRAIN_3",
  18: "FERRY_TRAIN_4",
  19: "FERRY_TRAIN_5",
  20: "FERRY_TRAIN_6",
  21: "Keep_Left_1",
  22: "Keep_Left_2",
  23: "Keep_Right_1",
  24: "Keep_Right_3",
  25: "Merge Left_1",
  26: "Merge Left_2",
  27: "Merge Left_3",
  28: "Merge Left_4",
  29: "Merge Left_5",
  30: "Merge Left_6",
  31: "Merge Right_1",
  32: "Merge Right_2",
  33: "Merge Right_3",
  34: "Merge Right_4",
  35: "Merge Right_5",
  36: "Merge Right_6",
  37: "NOTHING_1",
  38: "NOTHING_2",
  39: "NOTHING_3",
  40: "NOTHING_4",
  41: "NOTHING_5",
  42: "NOTHING_6",
  43: "ONRAMP_LEFT_1",
  44: "ONRAMP_LEFT_2",
  45: "ONRAMP_LEFT_3",
  46: "ONRAMP_LEFT_4",
  47: "ONRAMP_LEFT_5",
  48: "ONRAMP_LEFT_6",
  49: "ONRAMP_RIGHT_1",
  50: "ONRAMP_RIGHT_2",
  51: "ONRAMP_RIGHT_3",
  52: "ONRAMP_RIGHT_4",
  53: "ONRAMP_RIGHT_5",
  54: "ONRAMP_RIGHT_6",
  55: "ONRAMP_SHARP_LEFT_1",
  56: "ONRAMP_SHARP_LEFT_2",
  57: "ONRAMP_SHARP_LEFT_3",
  58: "ONRAMP_SHARP_LEFT_4",
  59: "ONRAMP_SHARP_LEFT_5",
  60: "ONRAMP_SHARP_LEFT_6",
  61: "ONRAMP_SHARP_RIGHT_1",
  62: "ONRAMP_SHARP_RIGHT_2",
  63: "ONRAMP_SHARP_RIGHT_3",
  64: "ONRAMP_SHARP_RIGHT_4",
  65: "ONRAMP_SHARP_RIGHT_6",
  66: "ONRAMP_SLIGHT_LEFT_1",
  67: "ONRAMP_SLIGHT_LEFT_2",
  68: "ONRAMP_SLIGHT_LEFT_3",
  69: "ONRAMP_SLIGHT_LEFT_4",
  70: "ONRAMP_SLIGHT_LEFT_5",
  71: "ONRAMP_SLIGHT_LEFT_6",
  72: "ONRAMP_SLIGHT_RIGHT_1",
  73: "ONRAMP_SLIGHT_RIGHT_2",
  74: "ONRAMP_SLIGHT_RIGHT_3",
  75: "ONRAMP_SLIGHT_RIGHT_4",
  76: "ONRAMP_SLIGHT_RIGHT_5",
  77: "ONRAMP_SLIGHT_RIGHT_6",
  78: "ON_RAMP",
  79: "ON_RAMP_1",
  80: "ON_RAMP_2",
  81: "ON_RAMP_3",
  82: "ON_RAMP_4",
  83: "ON_RAMP_5",
  84: "ON_RAMP_6",
  85: "Re-route_Indication",
  86: "Round_ABOUT_RIGHT_1",
  87: "Round_ABOUT_RIGHT_2",
  88: "Round_ABOUT_RIGHT_3",
  89: "Round_ABOUT_RIGHT_4",
  90: "Round_ABOUT_RIGHT_5",
  91: "Round_ABOUT_RIGHT_6",
  92: "Roundabout -without exit number-_1",
  93: "Roundabout -without exit number-_2",
  94: "Roundabout -without exit number-_3",
  95: "Roundabout -without exit number-_5",
  96: "Roundabout -without exit number-_6",
  97: "Slight_Left_1",
  98: "Slight_Left_4",
  99: "Slight_Left_5",
  100: "Slight_Left_6",
  101: "Slight_Left_7",
  102: "Slight_Left_8",
  103: "Slight_Right_1",
  104: "Slight_Right_4",
  105: "Slight_Right_5",
  106: "Slight_Right_6",
  107: "Slight_Right_7",
  108: "Slight_Right_8",
  109: "Straight_10",
  110: "Straight_5",
  111: "Straight_6",
  112: "Straight_7",
  113: "Straight_8",
  114: "Straight_9",
  // "115": "Tripper_pod",
  116: "Turn_Left_1",
  117: "Turn_Left_10",
  118: "Turn_Left_6",
  119: "Turn_Left_7",
  120: "Turn_Left_8",
  121: "Turn_Left_9",
  122: "Turn_Right_11",
  123: "Turn_Right_12",
  124: "Turn_Right_13",
  125: "Turn_Right_14",
  126: "Turn_Right_15",
  127: "Turn_Right_16",
  128: "fork_sharp_left_1",
  129: "fork_sharp_left_2",
  130: "fork_sharp_left_3",
  131: "fork_sharp_left_4",
  132: "fork_sharp_left_5",
  133: "fork_sharp_left_6",
  134: "fork_sharp_right_1",
  135: "fork_sharp_right_2",
  136: "fork_sharp_right_3",
  137: "fork_sharp_right_4",
  138: "fork_sharp_right_5",
  139: "fork_sharp_right_6",
  140: "fork_slight_left_1",
  141: "fork_slight_left_2",
  142: "fork_slight_left_3",
  143: "fork_slight_left_4",
  144: "fork_slight_left_5",
  145: "fork_slight_left_6",
  146: "fork_slight_right_1",
  147: "fork_slight_right_2",
  148: "fork_slight_right_3",
  149: "fork_slight_right_4",
  150: "fork_slight_right_5",
  151: "fork_slight_right_6",
  152: "merge_sharp_left_1",
  153: "merge_sharp_left_2",
  154: "merge_sharp_left_3",
  155: "merge_sharp_left_4",
  156: "merge_sharp_left_5",
  157: "merge_sharp_left_6",
  158: "merge_sharp_right_1",
  159: "merge_sharp_right_2",
  160: "merge_sharp_right_3",
  161: "merge_sharp_right_4",
  162: "merge_sharp_right_5",
  163: "merge_sharp_right_6",
  164: "merge_slight_left_1",
  165: "merge_slight_left_2",
  166: "merge_slight_left_3",
  167: "merge_slight_left_4",
  168: "merge_slight_left_5",
  169: "merge_slight_left_6",
  170: "merge_slight_right_1",
  171: "merge_slight_right_2",
  172: "merge_slight_right_3",
  173: "merge_slight_right_4",
  174: "merge_slight_right_6",
  175: "off_ramp_sharp_left_1",
  176: "off_ramp_sharp_left_2",
  177: "off_ramp_sharp_left_3",
  178: "off_ramp_sharp_left_4",
  179: "off_ramp_sharp_left_5",
  180: "off_ramp_sharp_left_6",
  181: "off_ramp_sharp_right_1",
  182: "off_ramp_sharp_right_2",
  183: "off_ramp_sharp_right_3",
  184: "off_ramp_sharp_right_5",
  185: "off_ramp_sharp_right_6",
  186: "off_ramp_slight_left_1",
  187: "off_ramp_slight_left_2",
  188: "off_ramp_slight_left_3",
  189: "off_ramp_slight_left_4",
  190: "off_ramp_slight_left_5",
  191: "off_ramp_slight_left_6",
  192: "off_ramp_slight_right_1",
  193: "off_ramp_slight_right_2",
  194: "off_ramp_slight_right_3",
  195: "off_ramp_slight_right_4",
  196: "off_ramp_slight_right_5",
  197: "off_ramp_slight_right_6",
  // "198": "text_1",
  // "199": "text_2",
  200: "uTurn_Left_1",
  201: "uTurn_Left_2",
  202: "uTurn_Left_3",
  203: "uTurn_Left_4",
  204: "uTurn_Left_5",
  205: "uTurn_Left_6",
  206: "uTurn_Right_1",
  207: "uTurn_Right_2",
  208: "uTurn_Right_3",
  209: "uTurn_Right_4",
  210: "uTurn_Right_5",
  211: "uTurn_Right_6",
};
