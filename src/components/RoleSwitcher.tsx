import React from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABELS, ROLE_HOMES, type AppRole } from "@/hooks/useAuth";

interface RoleSwitcherProps {
  variant?: "compact" | "inline";
  className?: string;
}

const RoleSwitcher = ({ variant = "compact", className }: RoleSwitcherProps) => {
  const { roles, activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();

  if (roles.length <= 1) return null;

  const current = activeRole ?? roles[0];
  const currentLabel = ROLE_LABELS[current] ?? current;

  const handleSelect = (role: AppRole) => {
    setActiveRole(role);
    const home = ROLE_HOMES[role];
    if (home) navigate(home);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={variant === "compact" ? "sm" : "default"}
          className={cn(
            "rounded-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10",
            className,
          )}
        >
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">{currentLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-background">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Switch role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const isActive = role === current;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleSelect(role)}
              className="cursor-pointer flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{ROLE_LABELS[role] ?? role}</span>
                <span className="text-[11px] text-muted-foreground">{ROLE_HOMES[role] ?? "/"}</span>
              </div>
              {isActive ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Badge variant="secondary" className="text-[10px]">Switch</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;