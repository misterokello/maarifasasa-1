import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, PlayCircle, FileText, HelpCircle, ClipboardList, FileQuestion } from "lucide-react";

interface Lesson {
  name: string;
  content_type?: string | null;
}

interface Chapter {
  name: string;
  contents_count: number;
  lessons?: Lesson[];
}

function lessonIcon(type?: string | null) {
  const t = (type || "").toLowerCase();
  if (t.includes("video")) return PlayCircle;
  if (t.includes("quiz")) return HelpCircle;
  if (t.includes("survey")) return ClipboardList;
  if (t.includes("exam") || t.includes("assignment")) return FileQuestion;
  return FileText;
}

interface CourseOutlineProps {
  chapters: Chapter[];
}

export function CourseOutline({ chapters }: CourseOutlineProps) {
  if (!chapters.length) return null;

  const totalLessons = chapters.reduce((sum, ch) => sum + ch.contents_count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Course Outline
        </h3>
        <span className="text-sm text-muted-foreground">
          {chapters.length} chapters · {totalLessons} lessons
        </span>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {chapters.map((chapter, index) => (
          <AccordionItem key={index} value={`chapter-${index}`}>
            <AccordionTrigger className="text-sm hover:no-underline">
              <span className="flex items-center gap-2 text-left">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                {chapter.name}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {chapter.lessons && chapter.lessons.length > 0 ? (
                <ul className="space-y-1.5 pl-8">
                  {chapter.lessons.map((lesson, i) => {
                    const Icon = lessonIcon(lesson.content_type);
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary/70" />
                        <span>{lesson.name}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm pl-8">
                  {chapter.contents_count} {chapter.contents_count === 1 ? "lesson" : "lessons"}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
