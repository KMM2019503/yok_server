// signedUploadService.js
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getSignedUploadDetails = (folder = 'testing') => {
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = cloudinary.v2.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/testing`,
    api_key: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
  };
};
