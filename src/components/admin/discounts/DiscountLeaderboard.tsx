import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { DiscountCodeRow, fetchDiscountCodes } from "@/lib/discountAdmin";

type SortKey = "redemptions_count" | "total_commission" | "signups_count" | "clicks";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "redemptions_count", label: "Paid sales" },
  { key: "total_commission", label: "Commission" },
  { key: "signups_count", label: "Signups" },
  { key: "clicks", label: "Clicks" },
];

export function DiscountLeaderboard() {
  const [rows, setRows] = useState<DiscountCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("redemptions_count");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchDiscountCodes());
    } catch (e) {
      toast.error((e as Error).message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0)),
    [rows, sortKey],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Referrer leaderboard
        </CardTitle>
        <div className="flex items-center gap-2">
          {SORTS.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={sortKey === s.key ? "default" : "outline"}
              onClick={() => setSortKey(s.key)}
            >
              {s.label}
            </Button>
          ))}
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No participants yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Signups</TableHead>
                  <TableHead className="text-right">Paid sales</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {i < 3 ? (
                        <Badge variant="default">{i + 1}</Badge>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{r.owner_name || r.label || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.owner_email || ""}</div>
                    </TableCell>
                    <TableCell className="font-mono">{r.code}</TableCell>
                    <TableCell className="text-right">{r.clicks}</TableCell>
                    <TableCell className="text-right">{r.signups_count}</TableCell>
                    <TableCell className="text-right">{r.redemptions_count}</TableCell>
                    <TableCell className="text-right">
                      {Number(r.total_commission || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}