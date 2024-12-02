// file.routes.js
import { Router } from "express";
import { getSignedUploadDetails } from "../utils/signedUploadService.js";

const router = Router();

// Chat attachment, profile picture, group profile picture, channel profile picture
router.post("/generate-presigned-url", async (req, res) => {
  try {
    // Extract folder from request body (based on type of upload)
    const { folderType, fileType, fileSize } = req.body;

    // Define folder names based on folderType (can be expanded)
    let folder = "uploads"; // default folder
    switch (folderType) {
      case "chatAttachment":
        folder = "chat-attachments";
        break;
      case "profilePicture":
        folder = "profile-pictures";
        break;
      case "groupProfilePicture":
        folder = "group-profile-pictures";
        break;
      case "channelProfilePicture":
        folder = "channel-profile-pictures";
        break;
      default:
        folder = "general-uploads";
    }

    // Generate signed URL details
    const uploadDetails = await getSignedUploadDetails(folder, fileType, fileSize);
    
    res.status(200).json({
      success: true,
      uploadDetails,
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ success: false,error: error.message });
  }
});

export default router;
