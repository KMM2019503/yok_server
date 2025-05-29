// Stores user locations
import prisma from "../../../prisma/prismaClient";

export const usersLocation = [];

export const updateUserLocation = (userId, location) => {
  const existingUserIndex = usersLocation.findIndex(
    (user) => user.userId === userId
  );

  if (existingUserIndex !== -1) {
    usersLocation[existingUserIndex] = { userId, location };
  } else {
    usersLocation.push({ userId, location });
  }

  console.log("🚀 ~ updateUserLocation ~ usersLocation:", usersLocation);
};

export const deleteUserLocation = (userId) => {
  const existingUserIndex = usersLocation.findIndex(
    (user) => user.userId === userId
  );

  if (existingUserIndex !== -1) {
    usersLocation.splice(existingUserIndex, 1);
  }
};

export const findNearUsers = async (userId, currentLocation, maxDistance) => {
  // Validate input parameters
  if (!userId || typeof userId !== "string") {
    throw new Error("Valid userId must be provided");
  }

  if (
    !currentLocation ||
    typeof currentLocation.latitude !== "number" ||
    typeof currentLocation.longitude !== "number"
  ) {
    throw new Error(
      "Valid currentLocation with latitude and longitude must be provided"
    );
  }

  if (typeof maxDistance !== "number" || maxDistance <= 0) {
    throw new Error("maxDistance must be a positive number");
  }

  // Find nearby users
  const nearbyUsers = usersLocation.filter((user) => {
    // Skip the current user
    if (user.userId === userId) return false;

    // Calculate distance to this user
    try {
      const distance = calculateDistance(currentLocation, user.location);
      return distance <= maxDistance;
    } catch (error) {
      console.error(
        `Error calculating distance for user ${user.userId}:`,
        error
      );
      return false;
    }
  });

  // If no nearby users found
  if (nearbyUsers.length === 0) {
    return {
      message: "No nearby users found within the specified distance.",
      users: [],
    };
  }

  // Get user details from database
  try {
    const users = await prisma.user.findMany({
      where: {
        id: { in: nearbyUsers.map((user) => user.userId) },
      },
      select: {
        id: true,
        userName: true,
        profilePictureUrl: true,
        email: true,
        userUniqueID: true,
        lastActiveAt: true,
      },
    });

    return {
      message: "Successfully found nearby users within the specified distance.",
      users: users,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw new Error("Failed to fetch nearby user details");
  }
};

export const calculateDistance = (loc1, loc2) => {
  // Validate input locations
  if (!loc1 || !loc2) {
    throw new Error("Both locations must be provided");
  }

  if (
    typeof loc1.latitude !== "number" ||
    typeof loc1.longitude !== "number" ||
    typeof loc2.latitude !== "number" ||
    typeof loc2.longitude !== "number"
  ) {
    throw new Error("Locations must have numeric latitude and longitude");
  }

  // Convert degrees to radians
  const toRad = (deg) => deg * (Math.PI / 180);

  // Earth's radius in km
  const R = 6371;

  const lat1 = toRad(loc1.latitude);
  const lon1 = toRad(loc1.longitude);
  const lat2 = toRad(loc2.latitude);
  const lon2 = toRad(loc2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
