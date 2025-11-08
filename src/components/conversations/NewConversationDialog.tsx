"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, X, Users } from "lucide-react";
import { useContacts } from "@/domains/users/hooks";
import { useCreateConversation } from "@/domains/chat/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Contact } from "@/domains/users/types";
import { useRouter } from "next/navigation";

type NewConversationDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function NewConversationDialog({ open, onClose }: NewConversationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const router = useRouter();
  const { data, isLoading, error } = useContacts({ search: searchQuery || undefined });
  const { mutateAsync: createConversation, isPending } = useCreateConversation();

  // Filter contacts locally for instant feedback
  const filteredContacts = useMemo(() => {
    if (!data?.contacts) return [];
    if (!searchQuery.trim()) return data.contacts;
    
    const query = searchQuery.toLowerCase();
    return data.contacts.filter(
      (user) =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  const handleSelectContact = async (contact: Contact) => {
    try {
      // Set the selected contact to show loading indicator
      setSelectedContactId(contact.id);
      
      // Create a direct conversation with the selected contact
      const conversation = await createConversation({
        type: "direct",
        participant_ids: [contact.id],
      });

      // Navigate to the conversation
      router.push(`/conversations/${conversation.id}`);
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setSelectedContactId(null);
      // TODO: Show error toast
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case "teacher":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "student":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "parent":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getUserTypeLabel = (userType: string) => {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-full md:max-w-lg h-screen md:h-auto md:max-h-[85vh] flex flex-col p-0 w-full md:w-auto !translate-x-0 !translate-y-0 !top-0 !left-0 md:!translate-x-[-50%] md:!translate-y-[-50%] md:!top-[50%] md:!left-[50%] rounded-none md:rounded-lg [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">New Conversation</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Select a contact from your school to start chatting
          </p>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Contacts List */}
        <ScrollArea className="flex-1 px-6 py-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-600 mb-2">Failed to load contacts</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              {searchQuery ? (
                <>
                  <p className="text-sm text-muted-foreground mb-1">No contacts found</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">No contacts available</p>
                  <p className="text-xs text-muted-foreground">
                    You don&apos;t have any contacts from your school yet
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  disabled={isPending && selectedContactId === contact.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarImage src={contact.avatar_url || undefined} alt={`${contact.first_name} ${contact.last_name}`} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {contact.first_name[0]}{contact.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.user_type && (
                        <Badge className={`text-xs px-2 py-0 ${getUserTypeColor(contact.user_type)}`}>
                          {getUserTypeLabel(contact.user_type)}
                        </Badge>
                      )}
                    </div>
                    {contact.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.email}
                      </p>
                    )}
                  </div>
                  {isPending && selectedContactId === contact.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {data && data.contacts.length > 0 && (
          <div className="px-6 py-3 border-t bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-muted-foreground text-center">
              Showing {filteredContacts.length} of {data.contacts.length} contact{data.contacts.length !== 1 ? 's' : ''} from your school
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

