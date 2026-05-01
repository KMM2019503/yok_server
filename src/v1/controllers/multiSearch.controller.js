import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient();

// export const findByName = async (req, res) => {
//   try {
//     const { name } = req.query;
//     const result = await prisma.$runCommandRaw({
//       aggregate: "groups", // Specify the collection name
//       pipeline: [
//         {
//           $search: {
//             index: "groupNameSearch", // Use your actual Atlas Search index name
//             text: {
//               query: name,
//               path: "name", // Field to search in
//               fuzzy: {}, // Enable fuzzy search if needed
//             },
//           },
//         },
//         {
//           $project: {
//             name: 1,
//             description: 1,
//             isPublic: 1,
//             profilePictureUrl: 1,
//           },
//         },
//       ],
//       cursor: {},
//     });

//     // Check if any groups were found
//     if (result.cursor.firstBatch.length === 0) {
//       throw new Error("No results found");
//     }

//     // Filter out private groups if necessary (check access for the user)
//     const data = result.cursor.firstBatch.filter((item) => item.isPublic);

//     const response = {
//       success: true,
//       data: data,
//     };

//     res.status(200).json(response);
//   } catch (error) {
//     logger.error("Error occurred during Multi Find By Name:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     res.status(500).json({ error: error.message, success: false });
//   }
// };

export const findByName = async (req, res) => {
  try {
    const { name } = req.query;

    // Run both queries in parallel using Promise.all
    const [groupResult, channelResult] = await Promise.all([
      prisma.$runCommandRaw({
        aggregate: "groups",
        pipeline: [
          {
            $search: {
              index: "groupNameSearch",
              text: {
                query: name,
                path: "name",
                fuzzy: {}, // Optional fuzzy search
              },
            },
          },
          {
            $project: {
              name: 1,
              description: 1,
              isPublic: 1,
              profilePictureUrl: 1,
            },
          },
          {
            $match: { isPublic: true },
          },
        ],
        cursor: {},
      }),

      prisma.$runCommandRaw({
        aggregate: "channels",
        pipeline: [
          {
            $search: {
              index: "channelNameSearch",
              text: {
                query: name,
                path: "name",
                fuzzy: {}, // Optional fuzzy search
              },
            },
          },
          {
            $project: {
              name: 1,
              description: 1,
              isPublic: 1,
              profilePictureUrl: 1,
            },
          },
          {
            $match: { isPublic: true },
          },
        ],
        cursor: {},
      }),
    ]);

    // Combine the results from both collections
    const combinedResults = [
      ...groupResult.cursor.firstBatch,
      ...channelResult.cursor.firstBatch,
    ];

    // Return response
    const response = {
      success: true,
      data: combinedResults,
    };

    res.status(200).json(response);
  } catch (error) {
    // Detailed error handling
    logger.error("Error occurred during Multi Find By Name:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};
