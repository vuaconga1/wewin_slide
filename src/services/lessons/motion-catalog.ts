export const MOTION_ANIMATIONS = ["rise"] as const;
export const MOTION_TRANSITIONS = ["fade"] as const;

export type MotionAnimation = (typeof MOTION_ANIMATIONS)[number];
export type MotionTransition = (typeof MOTION_TRANSITIONS)[number];

export const DEFAULT_ANIMATION: MotionAnimation = "rise";
export const DEFAULT_TRANSITION: MotionTransition = "fade";

export const MOTION_CATALOG = [
  {
    id: DEFAULT_ANIMATION,
    kind: "animation" as const,
    label: "Rise",
    detail: "Mỗi element trượt lên nhẹ và hiện dần, lần lượt từ trên xuống.",
  },
  {
    id: DEFAULT_TRANSITION,
    kind: "transition" as const,
    label: "Fade",
    detail: "Cả slide mờ dần khi chuyển sang slide kế tiếp.",
  },
];

export function coerceAnimation(value: string): MotionAnimation {
  return (MOTION_ANIMATIONS as readonly string[]).includes(value) ? (value as MotionAnimation) : DEFAULT_ANIMATION;
}

export function coerceTransition(value: string): MotionTransition {
  return (MOTION_TRANSITIONS as readonly string[]).includes(value) ? (value as MotionTransition) : DEFAULT_TRANSITION;
}

export function motionInstruction() {
  return `Mỗi slide phải có animation "${DEFAULT_ANIMATION}" và transition "${DEFAULT_TRANSITION}". Đó là hai id duy nhất trong thư viện chuyển động. Không bịa id khác và không viết CSS.`;
}
