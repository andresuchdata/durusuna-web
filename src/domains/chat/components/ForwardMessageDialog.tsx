"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Check } from "lucide-react";
import type { Conversation } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  onForward: (conversationId: string) => void;
  isForwarding: boolean;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  conversations,
  onForward,
  isForwarding,
}: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    
    // For direct chats, search by other user's name
    if (conv.type === "direct" && conv.other_user) {
      const name = `${conv.other_user.first_name} ${conv.other_user.last_name}`.toLowerCase();
      return name.includes(query);
    }
    
    // For group chats, search by group name
    if (conv.type === "group" && conv.name) {
      return conv.name.toLowerCase().includes(query);
    }
    
    return true;
  });

  const handleForward = () => {
    if (selectedConversationId) {
      onForward(selectedConversationId);
      setSelectedConversationId(null);
      setSearchQuery("");
    }
  };

  const handleClose = () => {
    setSelectedConversationId(null);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select a conversation to forward this message to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations list */}
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConversationId === conv.id;
                  const displayName = conv.type === "direct" && conv.other_user
                    ? `${conv.other_user.first_name} ${conv.other_user.last_name}`
                    : conv.name || "Group Chat";
                  
                  const displayAvatar = conv.type === "direct" && conv.other_user
                    ? conv.other_user.avatar_url
                    : conv.avatar_url;
                  
                  const initials = conv.type === "direct" && conv.other_user
                    ? `${conv.other_user.first_name[0]}${conv.other_user.last_name[0]}`
                    : displayName.substring(0, 2).toUpperCase();

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                        isSelected ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-600" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={displayAvatar ?? undefined} alt={displayName} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{displayName}</div>
                        {conv.type === "group" && (
                          <div className="text-xs text-muted-foreground">
                            {conv.participants?.length || 0} members
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <Check className="h-5 w-5 text-emerald-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isForwarding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleForward}
              disabled={!selectedConversationId || isForwarding}
            >
              {isForwarding ? "Forwarding..." : "Forward"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

