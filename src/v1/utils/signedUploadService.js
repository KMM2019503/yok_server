import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_TRANSFORMATIONS = "c_limit,w_800,h_800"; // Resize image to max 800x800
const VIDEO_TRANSFORMATIONS = "c_limit,w_1280,h_720,q_auto"; // Resize video to 720p and auto quality

const validateFileType = (fileType) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/mkv", "video/webm"];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (!allowedTypes.includes(fileType)) {
    throw new Error("Unsupported file type.");
  }

  return fileType.startsWith("image/")
    ? IMAGE_TRANSFORMATIONS
    : VIDEO_TRANSFORMATIONS;
};

export const getSignedUploadDetails = async (
  folder = "uploads",
  fileType,
  fileSize
) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 10MB limit.");
  }

  try {
    const transformations = validateFileType(fileType);

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await cloudinary.v2.utils.api_sign_request(
      {
        timestamp,
        // timestamp,
        // folder,
        // transformation: transformations,
      },
      process.env.CLOUDINARY_API_SECRET
    );
    console.log("🚀 ~ signature:", signature);

    return {
      url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      api_key: process.env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder,
      transformation: transformations,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};
