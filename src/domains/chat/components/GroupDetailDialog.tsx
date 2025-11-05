"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupDetailDialogProps {
  open: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    participants?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
      user_type?: string;
    }>;
    created_at?: string;
  } | null;
  onViewParticipant?: (userId: string) => void;
}

export function GroupDetailDialog({ open, onClose, group, onViewParticipant }: GroupDetailDialogProps) {
  if (!group) return null;

  const participantCount = group.participants?.length || 0;
  const groupInitials = group.name
    .split(" ")
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Group Info</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Group Header */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Avatar className="h-24 w-24">
                <AvatarImage src={group.avatar_url || undefined} alt={group.name} />
                <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                  {groupInitials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="text-center">
              <h3 className="text-xl font-semibold">{group.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Group · {participantCount} participants
              </p>
            </div>

            {group.description && (
              <p className="text-sm text-center text-muted-foreground px-4">
                {group.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium px-1">
              <Users className="h-4 w-4" />
              <span>{participantCount} Participants</span>
            </div>

            <ScrollArea className="h-[300px] rounded-lg border">
              <div className="p-2 space-y-1">
                {group.participants?.map((participant, index) => {
                  const fullName = `${participant.first_name} ${participant.last_name}`;
                  const initials = `${participant.first_name[0]}${participant.last_name[0]}`;

                  return (
                    <motion.button
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onViewParticipant?.(participant.id);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1f2c33] transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.avatar_url} alt={fullName} />
                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium truncate">{fullName}</p>
                        {participant.user_type && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {participant.user_type}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Leave Group */}
          <Button variant="destructive" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Leave Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

