import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, ExternalLink, Eye, Mail } from "lucide-react";
import { format } from "date-fns";

export default function SavedPathwaysView() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-saved-pathways"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advisor_assessments")
        .select("id, share_code, full_name, email, recommendation, answers, created_at, chat_history")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60_000,
  });

  const open = data?.find((a: any) => a.id === openId);

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
        ) : !data?.length ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No assessments saved yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Primary pick</TableHead>
                <TableHead>Fit</TableHead>
                <TableHead>Chats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a: any) => {
                const primary = a?.recommendation?.primary;
                const chats = Array.isArray(a?.chat_history) ? a.chat_history.length : 0;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{format(new Date(a.created_at), "d MMM, HH:mm")}</TableCell>
                    <TableCell>
                      <div className="font-medium">{a.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1">{a.email ? <><Mail className="w-3 h-3" /> {a.email}</> : "Guest"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{a?.answers?.career_goal || "—"}</TableCell>
                    <TableCell className="text-sm">{primary?.product_slug || "—"}</TableCell>
                    <TableCell>{primary?.fit_score ? <Badge variant="secondary">{primary.fit_score}/5</Badge> : "—"}</TableCell>
                    <TableCell>{chats > 0 ? <Badge>{chats}</Badge> : <span className="text-xs text-muted-foreground">0</span>}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(a.id)}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/advisor/r/${a.share_code}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Pathway detail</SheetTitle></SheetHeader>
          {open && (
            <div className="mt-4 space-y-4 text-sm">
              <section>
                <div className="text-xs uppercase text-muted-foreground mb-1">Learner</div>
                <div>{open.full_name || "—"} · {open.email || "Guest"}</div>
              </section>
              <section>
                <div className="text-xs uppercase text-muted-foreground mb-1">Wizard answers</div>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{JSON.stringify(open.answers, null, 2)}</pre>
              </section>
              <section>
                <div className="text-xs uppercase text-muted-foreground mb-1">Recommendation</div>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-[400px]">{JSON.stringify(open.recommendation, null, 2)}</pre>
              </section>
              {Array.isArray(open.chat_history) && open.chat_history.length > 0 && (
                <section>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Chat transcript ({open.chat_history.length})</div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {open.chat_history.map((m: any, i: number) => (
                      <div key={i} className={`p-2 rounded ${m.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                        <div className="text-[10px] uppercase font-medium text-muted-foreground mb-1">{m.role}</div>
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
