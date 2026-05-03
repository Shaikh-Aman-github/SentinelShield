const fs = require("fs/promises");

let writing = false;

const safeWrite = async (file, data) => {
  while (writing) {
    await new Promise((r) => setTimeout(r, 5));
  }
  writing = true;

  await fs.writeFile(file, JSON.stringify(data, null, 2));

  writing = false;
};

module.exports = { safeWrite };