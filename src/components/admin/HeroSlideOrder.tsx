import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, GripVertical, Loader2, RotateCcw, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useHeroSlideOrder, saveHeroSlideOrder } from "@/hooks/useHeroSlideOrder";
import {
  DEFAULT_HERO_ORDER,
  HERO_SLIDE_LABELS,
  type HeroSlideId,
} from "@/lib/heroSlides";

const move = (order: HeroSlideId[], from: number, to: number) => {
  if (to < 0 || to >= order.length) return order;
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const HeroSlideOrder = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useHeroSlideOrder();
  const [order, setOrder] = React.useState<HeroSlideId[]>(DEFAULT_HERO_ORDER);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (data && !dirty) setOrder(data);
  }, [data, dirty]);

  const update = (next: HeroSlideId[]) => {
    setOrder(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveHeroSlideOrder(order);
      await queryClient.invalidateQueries({ queryKey: ["hero-slide-order"] });
      setDirty(false);
      toast.success("Homepage hero order updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the hero order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GripVertical className="h-5 w-5 text-primary" />
          Homepage hero slides
        </CardTitle>
        <CardDescription>
          Drag to reorder, or use the arrows. The first slide is what visitors see when the
          homepage loads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading current order…
          </div>
        ) : (
          <ul className="space-y-2">
            {order.map((id, index) => (
              <li
                key={id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex === null || dragIndex === index) return;
                  update(move(order, dragIndex, index));
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
                className={`flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between ${
                  dragIndex === index ? "opacity-60" : ""
                }`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{HERO_SLIDE_LABELS[id]}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">Position {index + 1}</Badge>
                      {index === 0 && <Badge>First slide</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${id} up`}
                    disabled={index === 0}
                    onClick={() => update(move(order, index, index - 1))}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${id} down`}
                    disabled={index === order.length - 1}
                    onClick={() => update(move(order, index, index + 1))}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={index === 0}
                    onClick={() => update(move(order, index, 0))}
                  >
                    <Star className="mr-1 h-3.5 w-3.5" /> Make first
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save order
          </Button>
          <Button
            variant="ghost"
            onClick={() => update([...DEFAULT_HERO_ORDER])}
            disabled={saving}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset to default
          </Button>
          {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroSlideOrder;
