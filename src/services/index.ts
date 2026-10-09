/**
 * Mỗi nghiệp vụ nằm trong một thư mục riêng.
 * Route và page chỉ gọi service, không gọi Prisma trực tiếp.
 *
 * - db        kết nối Prisma
 * - auth      đăng nhập, phiên httpOnly, vai trò
 * - sources   đọc PDF, Word, TXT, link và lưu ảnh thủ công
 * - lessons   tạo, lưu và chỉnh bộ slide lịch sử
 */
export { prisma } from "./db/prisma";
export { extractSource } from "./sources/extract-source";
export { generateLesson } from "./lessons/generate-lesson";
export { lessonService } from "./lessons/lesson.service";
export { getCurrentUser, login, logout, requireUser } from "./auth/auth.service";
