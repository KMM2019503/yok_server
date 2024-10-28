import admin from "firebase-admin";
import { type ServiceAccount } from "firebase-admin"; // Fixed the import by removing the 'type' keyword

import serviceAccount from "../../../firebase-service-keys.json";

// Ensure serviceAccount is of type ServiceAccount
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount), // Cast to ServiceAccount
  });
}

export default admin;
