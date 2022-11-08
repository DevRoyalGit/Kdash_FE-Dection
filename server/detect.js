console.log("STARTING DETECT");

var table = 'GNS' // change the table name when needed

var mysql = require("mysql");
const { createWorker } = require("tesseract.js");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345",
  database: "test",
});

const worker = createWorker({
  logger: (m) => {},
});

const initializeWorker = async () => {
  await worker.load();
  console.log("loaded");
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  console.log("loaded languale");
};

connection.connect(async (err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);
  await initializeWorker();
  await predict(); //tipperpod
  await predictGMM(); //gmm
});

const predict = async () => {
  const query = `
    select * from tripper where is_verified =0;
  `;

  return new Promise((resolve) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ", results?.length);
      for (let i of results) {
        await getOCR(i, currentIndex);
        currentIndex += 1;
      }
      resolve(true);
    });
  });
};

const predictGMM = async () => {
  const query = `
    select * from ${table} where is_verified =0;
  `;

  return new Promise((resolve) => {
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      let currentIndex = 0;
      console.log("TOTAL: ${table}: ", results?.length);
      // results = results.slice(0,5)
      for (let i of results) {
        await getOCRGMM(i, currentIndex);
        currentIndex += 1;
      }
      resolve(true);
    });
  });
};

const getOCR = async (row, index) => {
  try {
    console.log("analysing ", index, Object.keys(row));

    console.log("dad");
    const {
      data: { text: topImage },
    } = await worker.recognize(row["topImage"]);
    console.log("###D ", topImage);
    const {
      data: { text: bottomImage },
    } = await worker.recognize(row["bottomImage"]);
    console.log(">>>", row.id, `${row.id}`, `${row["id"]}`);
    await storeUpdatedResult({
      id: row.id.toString(),
      image1Text: getFormattedText(topImage),
      image2Text: getFormattedText(bottomImage),
    });
  } catch (err) {
    console.log("GET OCR", err.message);
  }
};

const getOCRGMM = async (row, index) => {
  try {
    console.log("analysing ", index, Object.keys(row));

    let image1Text = "",
      image2Text = "";
    console.log("##>>1,",row["text_1"],);
    if (row["text_1"] !=='undefined' ) {
      const {
        data: { text: text1 },
      } = await worker.recognize(row["text_1"]);
      console.log("##", text1);
      image1Text = text1;
    }
    console.log("##>>2",row["text_2"]);
    if (row["text_2"] !=='undefined') {
      const {
        data: { text: text2 },
      } = await worker.recognize(row["text_2"]);
      image2Text = text2;
    }
    console.log(">>>", row.id, `${row.id}`, `${row["id"]}`);

    await storeUpdatedResultGMM({
      id: row.id.toString(),
      image1Text: getFormattedText(image1Text),
      image2Text: getFormattedText(image2Text),
    });
  } catch (err) {
    console.log(err.message);
  }
};

//isTextVerified

const storeUpdatedResult = async ({ id, image1Text, image2Text }) => {
  return new Promise((resolve) => {
    const query = `update tripper set  topImage = "${image1Text}", bottomImage= "${image2Text}",is_verified = TRUE  WHERE  id = ${id};`;
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      console.log(id, results);
      resolve(true);
    });
  });
};

const storeUpdatedResultGMM = async ({ id, image1Text, image2Text }) => {
  return new Promise((resolve) => {
    const query = `update ${table} set  text_1 = "${image1Text}", text_2= "${image2Text}",is_verified = TRUE  WHERE  id = ${id};`;
    connection.query(query, async (error, results, fields) => {
      if (error) throw new Error(error.message);
      console.log(id, results);
      resolve(true);
    });
  });
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nums = "0123456789";
const extraChars = " .";
const getFormattedText = (text) => {
  return text.split("").reduce((tot, cur) => {
    isValidChar = (CHARS + CHARS.toLowerCase() + nums + extraChars).includes(
      cur
    );
    if (isValidChar) return tot + cur;
    else return tot;
  }, "");
};
