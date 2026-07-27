import { cloudinary } from "@/config/cloudinary";

export const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result) return reject(err);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });