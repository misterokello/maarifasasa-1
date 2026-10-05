import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  DiscountCodeRow,
  fetchCodeProductIds,
  setCodeProducts,
  suggestCode,
} from "@/lib/discountAdmin";

interface ProductOption {
  id: string;
  name: string;
  category: string;
}

interface ProfileOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface Props {
  editing: DiscountCodeRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** Pre-fill from an approved application */
  prefill?: { name?: string; email?: string; requestedCode?: string } | null;
}

export function DiscountCodeForm({ editing, onDone, onCancel, prefill }: Props) {
  const [code, setCode] = useState(editing?.code ?? prefill?.requestedCode ?? "");
  const [label, setLabel] = useState(editing?.label ?? "");
  const [ownerName, setOwnerName] = useState(editing?.owner_name ?? prefill?.name ?? "");
  const [ownerEmail, setOwnerEmail] = useState(editing?.owner_email ?? prefill?.email ?? "");
  const [ownerUserId, setOwnerUserId] = useState<string | null>(editing?.owner_user_id ?? null);
  const [percentOff, setPercentOff] = useState(String(editing?.percent_off ?? 10));
  const [commission, setCommission] = useState(String(editing?.commission_percent ?? 0));
  const [maxRedemptions, setMaxRedemptions] = useState(
    editing?.max_redemptions != null ? String(editing.max_redemptions) : "",
  );
  const [startsAt, setStartsAt] = useState(editing?.starts_at?.slice(0, 10) ?? "");
  const [endsAt, setEndsAt] = useState(editing?.ends_at?.slice(0, 10) ?? "");
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [allProducts, setAllProducts] = useState(editing?.applies_to_all_products ?? false);
  const [notes, setNotes] = useState(editing?.notes ?? "");

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [productQuery, setProductQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: prods }, { data: profs }] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, category")
          .eq("is_active", true)
          .order("name"),
        supabase.from("profiles").select("id, email, full_name").order("created_at", { ascending: false }).limit(500),
      ]);
      setProducts((prods || []) as ProductOption[]);
      setProfiles((profs || []) as ProfileOption[]);
      if (editing) {
        try {
          setSelected(new Set(await fetchCodeProductIds(editing.id)));
        } catch {
          /* ignore */
        }
      } else if (prefill?.email) {
        const match = (profs || []).find(
          (p: ProfileOption) => p.email?.toLowerCase() === prefill.email?.toLowerCase(),
        );
        if (match) setOwnerUserId(match.id);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [products, productQuery]);

  const filteredProfiles = useMemo(() => {
    const q = ownerQuery.trim().toLowerCase();
    if (!q) return [];
    return profiles
      .filter(
        (p) =>
          p.email.toLowerCase().includes(q) || (p.full_name || "").toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [profiles, ownerQuery]);

  const save = async () => {
    const cleanCode = code.trim().toUpperCase();
    const pct = Number(percentOff);
    if (!cleanCode) return toast.error("Code is required");
    if (!(pct > 0 && pct <= 100)) return toast.error("Discount must be between 1 and 100%");
    if (!allProducts && selected.size === 0)
      return toast.error("Pick at least one course, or enable all courses");

    setSaving(true);
    const payload = {
      code: cleanCode,
      label: label.trim() || null,
      owner_user_id: ownerUserId,
      owner_name: ownerName.trim() || null,
      owner_email: ownerEmail.trim() || null,
      percent_off: pct,
      commission_percent: Number(commission) || 0,
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_active: isActive,
      applies_to_all_products: allProducts,
      notes: notes.trim() || null,
    };

    try {
      let codeId = editing?.id;
      if (editing) {
        const { error } = await supabase.from("discount_codes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("discount_codes")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        codeId = data.id;
      }
      if (codeId) await setCodeProducts(codeId, allProducts ? [] : Array.from(selected));
      toast.success(editing ? "Code updated" : "Code created");
      onDone();
    } catch (e) {
      const msg = (e as Error).message || "Failed to save code";
      toast.error(msg.toLowerCase().includes("duplicate") ? "That code already exists" : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dc-code">Code</Label>
          <div className="flex gap-2">
            <Input
              id="dc-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="JANEDOE10"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setCode(suggestCode(ownerName || label))}
              title="Suggest a code"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dc-label">Label (internal)</Label>
          <Input
            id="dc-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Jane Doe — Instagram"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dc-owner-name">Referrer name</Label>
          <Input id="dc-owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dc-owner-email">Referrer email</Label>
          <Input
            id="dc-owner-email"
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dc-owner-link">Link to a platform account (optional)</Label>
        {ownerUserId ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>
              {profiles.find((p) => p.id === ownerUserId)?.email || "Linked account"}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOwnerUserId(null)}>
              Unlink
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dc-owner-link"
                className="pl-8"
                placeholder="Search users by name or email…"
                value={ownerQuery}
                onChange={(e) => setOwnerQuery(e.target.value)}
              />
            </div>
            {filteredProfiles.length > 0 && (
              <div className="rounded-md border divide-y">
                {filteredProfiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setOwnerUserId(p.id);
                      setOwnerQuery("");
                      if (!ownerEmail) setOwnerEmail(p.email);
                      if (!ownerName && p.full_name) setOwnerName(p.full_name);
                    }}
                  >
                    <span className="font-medium">{p.full_name || "—"}</span>{" "}
                    <span className="text-muted-foreground">{p.email}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Linking lets the referrer see their own stats and leaderboard rank in their portal.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="dc-percent">Discount %</Label>
          <Input
            id="dc-percent"
            type="number"
            min={1}
            max={100}
            value={percentOff}
            onChange={(e) => setPercentOff(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dc-commission">Commission %</Label>
          <Input
            id="dc-commission"
            type="number"
            min={0}
            max={100}
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dc-start">Starts</Label>
          <Input id="dc-start" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dc-end">Ends</Label>
          <Input id="dc-end" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dc-max">Max redemptions (blank = unlimited)</Label>
          <Input
            id="dc-max"
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div>
            <Label htmlFor="dc-active">Active</Label>
            <p className="text-xs text-muted-foreground">Inactive codes are rejected at checkout.</p>
          </div>
          <Switch id="dc-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="dc-all">Applies to all courses</Label>
            <p className="text-xs text-muted-foreground">
              Turn off to limit the code to specific certificates, bootcamps or programs.
            </p>
          </div>
          <Switch id="dc-all" checked={allProducts} onCheckedChange={setAllProducts} />
        </div>

        {!allProducts && (
          <>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search courses…"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(p.id)}
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (v) next.add(p.id);
                        else next.delete(p.id);
                        return next;
                      })
                    }
                  />
                  <span className="text-sm flex-1">{p.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{p.category}</span>
                </label>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No courses match.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{selected.size} course(s) selected</p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dc-notes">Notes</Label>
        <Textarea id="dc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editing ? "Save changes" : "Create code"}
        </Button>
      </div>
    </div>
  );
}