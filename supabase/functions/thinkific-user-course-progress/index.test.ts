import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildProgress } from "./index.ts";

// Synthetic course structure: 2 chapters, 3 + 2 lessons = 5 total
const chapters = [
  { id: 10, name: "Chapter 1", position: 1 },
  { id: 20, name: "Chapter 2", position: 2 },
];
const contentLists = [
  [
    { id: 101, lesson_id: 101, name: "L1", content_type: "video", position: 1 },
    { id: 102, lesson_id: 102, name: "L2", content_type: "text", position: 2 },
    { id: 103, lesson_id: 103, name: "L3", content_type: "quiz", position: 3 },
  ],
  [
    { id: 201, lesson_id: 201, name: "L4", content_type: "video", position: 1 },
    { id: 202, lesson_id: 202, name: "L5", content_type: "text", position: 2 },
  ],
];

Deno.test("marks lesson completed only when a completion row exists for it", () => {
  const completions = [
    { lesson_id: 101, completed: true, completed_at: "2026-01-01T00:00:00Z" },
  ];
  const p = buildProgress(1, 42, chapters, contentLists, completions);
  assertEquals(p.total_lessons, 5);
  assertEquals(p.completed_lessons, 1);
  assertEquals(p.percentage_completed, 20);
  const l1 = p.chapters[0].lessons.find((l) => l.id === 101)!;
  assert(l1.completed, "L1 must be completed");
  for (const l of [102, 103, 201, 202]) {
    const lesson = p.chapters
      .flatMap((c) => c.lessons)
      .find((x) => x.id === l)!;
    assertEquals(lesson.completed, false);
  }
});

Deno.test("ignores completion rows that are not actually completed", () => {
  const completions = [
    { lesson_id: 101, completed: false, percentage_completed: 40 },
    { lesson_id: 102, completed: false, completed_at: null, percentage_completed: 0 },
  ];
  const p = buildProgress(1, 42, chapters, contentLists, completions);
  assertEquals(p.completed_lessons, 0);
  assertEquals(p.percentage_completed, 0);
});

Deno.test("ignores completion rows for lessons not in the course structure", () => {
  const completions = [
    { lesson_id: 999, completed: true, completed_at: "2026-01-01T00:00:00Z" },
    { lesson_id: 888, completed: true, completed_at: "2026-01-02T00:00:00Z" },
  ];
  const p = buildProgress(1, 42, chapters, contentLists, completions);
  assertEquals(p.completed_lessons, 0);
  assertEquals(p.percentage_completed, 0);
  // None of the course lessons flipped to completed
  for (const l of p.chapters.flatMap((c) => c.lessons)) {
    assertEquals(l.completed, false);
  }
});

Deno.test("accepts alternate completion signals (string, percentage, content_id)", () => {
  const completions = [
    { lesson_id: 101, completed: "true" },
    { lesson_id: 102, percentage_completed: 1 },
    { content_id: 201, completed_at: "2026-01-01T00:00:00Z" },
  ];
  const p = buildProgress(1, 42, chapters, contentLists, completions);
  assertEquals(p.completed_lessons, 3);
  assertEquals(p.percentage_completed, 60);
});

Deno.test("per-chapter counts reflect actual course structure", () => {
  const completions = [
    { lesson_id: 101, completed: true },
    { lesson_id: 103, completed: true },
    { lesson_id: 201, completed: true },
  ];
  const p = buildProgress(1, 42, chapters, contentLists, completions);
  assertEquals(p.chapters[0].total_count, 3);
  assertEquals(p.chapters[0].completed_count, 2);
  assertEquals(p.chapters[1].total_count, 2);
  assertEquals(p.chapters[1].completed_count, 1);
});

Deno.test("empty course structure yields 0% with no errors", () => {
  const p = buildProgress(1, 42, [], [], [
    { lesson_id: 1, completed: true },
  ]);
  assertEquals(p.total_lessons, 0);
  assertEquals(p.completed_lessons, 0);
  assertEquals(p.percentage_completed, 0);
  assertEquals(p.chapters.length, 0);
});

Deno.test("normalizes Thinkific enrollment percentage from 0.0-1.0 scale", () => {
  const p = buildProgress(1, 42, chapters, contentLists, [], {
    percentage_completed: "0.4",
    completed: false,
  });
  assertEquals(p.percentage_completed, 40);
  assertEquals(p.completed_lessons, 2);
  assertEquals(p.chapters[0].completed_count, 2);
  assertEquals(p.chapters[1].completed_count, 0);
});

Deno.test("completed enrollment marks actual course lessons complete when lesson completions are unavailable", () => {
  const p = buildProgress(1, 42, chapters, contentLists, [], {
    percentage_completed: "1.0",
    completed: true,
    completed_at: "2026-01-10T00:00:00Z",
  });
  assertEquals(p.percentage_completed, 100);
  assertEquals(p.completed_lessons, 5);
  assertEquals(p.chapters[0].completed_count, 3);
  assertEquals(p.chapters[1].completed_count, 2);
  assert(p.chapters.every((chapter) => chapter.lessons.every((lesson) => lesson.completed)));
});