const fs = require("fs/promises");
const path = require("path");

const getUploadUrl = (filename) => `/uploads/${filename}`;

const getUploadAbsolutePath = (relativeUrl) => {
  if (!relativeUrl || !relativeUrl.startsWith("/uploads/")) {
    return null;
  }

  return path.resolve(__dirname, "../../uploads", path.basename(relativeUrl));
};

const deleteLocalUpload = async (relativeUrl) => {
  const filePath = getUploadAbsolutePath(relativeUrl);
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

module.exports = { deleteLocalUpload, getUploadUrl };
