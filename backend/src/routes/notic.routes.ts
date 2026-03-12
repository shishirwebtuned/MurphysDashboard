import express from "express";
import { createNotice, getNotices, deleteNotice, toggleNoticeStatus, deleteManyNotices, markAllAsRead } from "../conttrolers/notic.conttrolers";
const noticeRouter = express.Router();

// Public route to create a new notice
noticeRouter.post('/notices', createNotice);
// Public route to get all notices
noticeRouter.get('/notices', getNotices);
// Public route to delete a notice by ID
noticeRouter.delete('/notices/:id', deleteNotice);
// Public route to toggle notice status
noticeRouter.post('/notices/toggleStatus', toggleNoticeStatus);
// Route to delete multiple notices
noticeRouter.post('/notices/delete-many', deleteManyNotices);
// Route to mark all notices as read
noticeRouter.post('/notices/mark-all-read', markAllAsRead);

export default noticeRouter;



