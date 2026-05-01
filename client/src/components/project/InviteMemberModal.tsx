import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, UserPlus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectOption } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { projectApi, type ProjectMember } from "@/services/project.service";

// ══════════════════════════════════════════════════════════════
// Invite Member Modal — search users by email and add to project
//
// flow:
// 1. admin types an email in the search box
// 2. we debounce-search the /users/search endpoint
// 3. matching users appear in a list
// 4. admin picks one and selects a role (ADMIN/MEMBER)
// 5. we call addMember with their userId
//
// existing members are shown with a "Already added" badge
// so you cant add someone twice
// ══════════════════════════════════════════════════════════════

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingMembers: ProjectMember[];
  onSuccess: () => void;
}

export default function InviteMemberModal({
  open,
  onOpenChange,
  projectId,
  existingMembers,
  onSuccess,
}: InviteMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // existing member IDs for "already added" check
  const existingUserIds = new Set(existingMembers.map((m) => m.userId));

  // debounced search
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await api.get("/users/search", {
        params: { email: query.trim() },
      });
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setSelectedRole("MEMBER");
      setError("");
      setSuccessMsg("");
    }
  }, [open]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setError("");
    setSuccessMsg("");
    setIsAdding(true);

    try {
      await projectApi.addMember(projectId, {
        userId: selectedUser.id,
        role: selectedRole,
      });

      setSuccessMsg(`${selectedUser.name} added as ${selectedRole}!`);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      onSuccess(); // refresh parent
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Search by email to find and add a user to this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* error/success messages */}
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              {successMsg}
            </div>
          )}

          {/* search input */}
          <div className="space-y-2">
            <Label>Search by Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Type email to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
              )}
            </div>
          </div>

          {/* search results */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.map((u) => {
                const isAlready = existingUserIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    disabled={isAlready}
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchQuery(u.email);
                      setSearchResults([]);
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 border-zinc-100 dark:border-zinc-800 ${
                      isAlready
                        ? "opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    }`}
                  >
                    <Avatar name={u.name} src={u.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                    </div>
                    {isAlready && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        Already added
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* no results */}
          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && !selectedUser && (
            <p className="text-sm text-zinc-400 text-center py-4">
              No users found with that email
            </p>
          )}

          {/* selected user preview */}
          {selectedUser && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.name} src={selectedUser.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* role selector */}
              <div className="mt-3">
                <Label className="text-xs">Role in this project</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as "ADMIN" | "MEMBER")}>
                  <SelectOption value="MEMBER">Member — can view & update assigned tasks</SelectOption>
                  <SelectOption value="ADMIN">Admin — full control over tasks & members</SelectOption>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            {successMsg ? "Done" : "Cancel"}
          </Button>
          {selectedUser && (
            <Button onClick={handleAddMember} disabled={isAdding}>
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Add Member
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
