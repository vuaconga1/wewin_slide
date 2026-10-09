import { prisma } from "@/services/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { AppError } from "@/lib/errors";
import { canManageLesson, type SessionUser } from "@/services/auth/types";
import { fillFromSource } from "./fill-from-source";
import {
  normalizeLesson,
  type Lesson,
  type LessonSlide,
} from "./lesson-types";

export type LessonConfig = {
  topic: string;
  grade: string;
  cefr: string;
  mode: string;
  durationMin: number;
  requestedCount: number;
  template: string;
  notes: string;
  sourceText: string;
};

function slideData(slide: LessonSlide, order: number) {
  return {
    order,
    layout: slide.layout,
    type: slide.type,
    titleVi: slide.title_vi,
    titleEn: slide.title_en,
    bodyVi: slide.body_vi,
    bodyEn: slide.body_en,
    teacherNotes: "",
    vocab: slide.vocab as Prisma.InputJsonValue,
    questionVi: slide.question_vi,
    questionEn: slide.question_en,
    choices: slide.choices as Prisma.InputJsonValue,
    sourceQuote: "",
    sourceOk: false,
    imageUrl: slide.image_url ?? null,
    imageX: slide.image_x,
    imageY: slide.image_y,
  };
}

function fromRecord(record: {
  id: string;
  titleVi: string;
  titleEn: string;
  warnings: Prisma.JsonValue;
  graph: Prisma.JsonValue;
  mission: Prisma.JsonValue;
  aiVsHistory: Prisma.JsonValue;
  sourceText?: string;
  slides: {
    id: string;
    layout: string;
    type: string;
    titleVi: string;
    titleEn: string;
    bodyVi: string;
    bodyEn: string;
    vocab: Prisma.JsonValue;
    questionVi: string;
    questionEn: string;
    choices: Prisma.JsonValue;
    imageUrl: string | null;
    imageX: number;
    imageY: number;
  }[];
}) {
  return fillFromSource(normalizeLesson({
    id: record.id,
    title_vi: record.titleVi,
    title_en: record.titleEn,
    warnings: record.warnings,
    graph: record.graph,
    mission: record.mission,
    ai_vs_history: record.aiVsHistory,
    slides: record.slides.map((slide) => ({
        id: slide.id,
        layout: slide.layout,
        type: slide.type,
        title_vi: slide.titleVi,
        title_en: slide.titleEn,
        body_vi: slide.bodyVi,
        body_en: slide.bodyEn,
        vocab: slide.vocab,
        question_vi: slide.questionVi,
        question_en: slide.questionEn,
        choices: slide.choices,
        image_url: slide.imageUrl,
        image_x: slide.imageX,
        image_y: slide.imageY,
      })),
  }), record.sourceText ?? "");
}

const include = {
  slides: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      layout: true,
      type: true,
      titleVi: true,
      titleEn: true,
      bodyVi: true,
      bodyEn: true,
      vocab: true,
      questionVi: true,
      questionEn: true,
      choices: true,
      imageUrl: true,
      imageX: true,
      imageY: true,
    },
  },
};

export type DesignSummary = {
  id: string;
  title: string;
  updatedAt: string;
  ownerUsername: string | null;
};

async function assertCanManage(id: string, actor: SessionUser) {
  const existing = await prisma.lesson.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing || !canManageLesson(actor, existing.ownerId)) {
    throw new AppError("Không tìm thấy bài giảng.", "NOT_FOUND");
  }
}

export const lessonService = {
  async list(actor: SessionUser): Promise<DesignSummary[]> {
    const records = await prisma.lesson.findMany({
      where: actor.role === "ADMIN" ? {} : { ownerId: actor.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        titleVi: true,
        topic: true,
        updatedAt: true,
        owner: { select: { username: true } },
      },
    });
    return records.map((row) => ({
      id: row.id,
      title: row.titleVi || row.topic,
      updatedAt: row.updatedAt.toISOString(),
      ownerUsername: row.owner?.username ?? null,
    }));
  },

  async get(id: string, actor: SessionUser) {
    await assertCanManage(id, actor);
    const record = await prisma.lesson.findUnique({ where: { id }, include });
    if (!record) throw new AppError("Không tìm thấy bài giảng.", "NOT_FOUND");
    return fromRecord(record);
  },

  async save(lesson: Lesson, config: LessonConfig, ownerId: string) {
    const created = await prisma.lesson.create({
      data: {
        ownerId,
        topic: config.topic,
        grade: config.grade,
        cefr: config.cefr,
        mode: config.mode,
        durationMin: config.durationMin,
        requestedCount: config.requestedCount,
        template: config.template,
        notes: config.notes,
        titleVi: lesson.title_vi,
        titleEn: lesson.title_en,
        warnings: lesson.warnings,
        graph: lesson.graph as Prisma.InputJsonValue,
        mission: (lesson.mission ?? {}) as Prisma.InputJsonValue,
        aiVsHistory: lesson.ai_vs_history as Prisma.InputJsonValue,
        sourceText: config.sourceText,
        slides: {
          create: lesson.slides.map((slide, index) => slideData(slide, index + 1)),
        },
      },
      include,
    });
    return fromRecord(created);
  },

  async update(id: string, lesson: Lesson, actor: SessionUser) {
    await assertCanManage(id, actor);
    return prisma.$transaction(async (tx) => {
      await tx.lessonSlide.deleteMany({ where: { lessonId: id } });
      const updated = await tx.lesson.update({
        where: { id },
        data: {
          titleVi: lesson.title_vi,
          titleEn: lesson.title_en,
          warnings: lesson.warnings,
          graph: lesson.graph as Prisma.InputJsonValue,
          mission: (lesson.mission ?? {}) as Prisma.InputJsonValue,
          aiVsHistory: lesson.ai_vs_history as Prisma.InputJsonValue,
          slides: {
            create: lesson.slides.map((slide, index) => slideData(slide, index + 1)),
          },
        },
        include,
      });
      return fromRecord(updated);
    });
  },
};
