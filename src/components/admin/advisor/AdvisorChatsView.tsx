import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function AdvisorChatsView() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-advisor-chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advisor_assessments")
        .select("id, share_code, full_name, email, chat_history, created_at, updated_at, recommendation")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []).filter((a: any) => Array.isArray(a.chat_history) && a.chat_history.length > 0);
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
          <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <MessageSquare className="w-8 h-8 opacity-30" />
            No chat transcripts yet. Chats persist when learners refine their pathway after saving.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Last activity</TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>Pick</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{format(new Date(a.updated_at), "d MMM, HH:mm")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{a.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{a.email || "Guest"}</div>
                  </TableCell>
                  <TableCell className="text-sm">{a?.recommendation?.primary?.product_slug || "—"}</TableCell>
                  <TableCell><Badge>{Array.isArray(a.chat_history) ? a.chat_history.length : 0}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(a.id)}>Read</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Chat transcript</SheetTitle></SheetHeader>
          {open && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-muted-foreground">{open.full_name || "Guest"} · {open.email || "—"}</div>
              <div className="space-y-3">
                {(Array.isArray(open.chat_history) ? open.chat_history : []).map((m: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg ${m.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                    <div className="text-[10px] uppercase font-medium text-muted-foreground mb-1">{m.role}</div>
                    <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
