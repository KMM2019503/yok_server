// routes/index.ts
import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes"
import userRoutes from "./users.routes"
import channelRoutes from "./channel.route"
import MessageRoutes from "./message.route"
import ConversationRoutes from "./conversation.route"
import ContactRoutes from "./contact.routes"
import GroupRoutes from "./groups.route"
import multiSearchRoutes from "./multiSearch.routes"
import FriendRoutes from "./friend.routes"
import FileUrl from "./file.routes"

const router = Router();

router.use("/", authRoutes)
router.use("/users", userRoutes)
router.use("/friends", FriendRoutes)
router.use("/channels", channelRoutes)
router.use("/messages", MessageRoutes)
router.use("/conversations", ConversationRoutes)
router.use('/contacts', ContactRoutes)
router.use('/groups', GroupRoutes)

router.use('/multiSearch', multiSearchRoutes)

router.use('/file', FileUrl)


// Add other routes here

export default router;
