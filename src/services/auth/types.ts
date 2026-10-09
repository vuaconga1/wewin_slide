export type SessionUser = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
};

export function canManageLesson(user: SessionUser, ownerId: string | null) {
  return user.role === "ADMIN" || ownerId === user.id;
}
