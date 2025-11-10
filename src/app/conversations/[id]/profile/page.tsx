"use client";

import { useParams, useRouter } from "next/navigation";
import { useConversations, useUpdateConversation, useUploadFile } from "@/domains/chat/hooks";
import { useProfile } from "@/domains/auth/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Calendar, Clock, MessageCircle, Phone, Video, UserPlus, Settings, LogOut, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useState, useRef } from "react";
import type { Conversation } from "@/domains/chat/types";

// Extended type to include user_type in other_user
type ConversationWithUserType = Conversation & {
  other_user?: Conversation['other_user'] & {
    user_type?: string;
  };
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { data: conversations } = useConversations();
  const { data: profile } = useProfile();
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  
  const updateConversationMutation = useUpdateConversation();
  const uploadFileMutation = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const conversation = conversations?.find(c => c.id === conversationId) as ConversationWithUserType | undefined;
  
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading conversation details...</p>
        </div>
      </div>
    );
  }

  const isGroup = conversation.type === "group";
  const title = isGroup 
    ? conversation.name || "Group Chat"
    : conversation.other_user 
      ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
      : "Chat";

  const avatarUrl = isGroup 
    ? conversation.avatar_url
    : conversation.other_user?.avatar_url;

  const initials = title
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const participantCount = conversation.participants?.length || 0;
  const displayedParticipants = showAllParticipants 
    ? conversation.participants 
    : conversation.participants?.slice(0, 5);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    try {
      // Upload the file
      const uploadResult = await uploadFileMutation.mutateAsync({
        file,
        folder: "group-avatars"
      });

      // Update the conversation with the new avatar URL
      await updateConversationMutation.mutateAsync({
        conversationId,
        data: { avatar_url: uploadResult.url }
      });

    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111b21]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#008069] dark:bg-[#008069] px-4 py-3 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-[#2a3942] h-9 w-9 p-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-white">
          {isGroup ? "Group Info" : "Contact Info"}
        </h1>
      </div>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="p-6 space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage src={avatarUrl || undefined} alt={title} />
                <AvatarFallback className="bg-emerald-600 text-white text-4xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              {/* Camera icon for group chats only */}
              {isGroup && (
                <button
                  onClick={openFileDialog}
                  disabled={uploadFileMutation.isPending || updateConversationMutation.isPending}
                  className="absolute bottom-2 right-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-2 shadow-lg transition-colors"
                  title="Change group avatar"
                >
                  {uploadFileMutation.isPending || updateConversationMutation.isPending ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              )}
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            {isGroup && (
              <p className="text-muted-foreground">
                Group • {participantCount} participants
              </p>
            )}
            {!isGroup && conversation.other_user?.user_type && (
              <p className="text-muted-foreground capitalize">
                {conversation.other_user.user_type}
              </p>
            )}
          </motion.div>

          {/* Group Description */}
          {isGroup && conversation.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gray-50 dark:bg-[#1f2c33] rounded-lg p-4"
            >
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-foreground">{conversation.description}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex gap-2"
          >
            <Button variant="outline" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            {!isGroup && (
              <>
                <Button variant="outline" className="flex-1" disabled>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </>
            )}
            {isGroup && (
              <Button variant="outline" className="flex-1">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Participants
              </Button>
            )}
          </motion.div>

          {/* Conversation Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Conversation Info</h3>
            
            <div className="space-y-3">
              {/* Created */}
              {conversation.created_at && (
                <div className="bg-gray-50 dark:bg-[#1f2c33] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                  <p className="text-sm text-foreground">
                    {new Date(conversation.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conversation.created_at))} ago
                  </p>
                </div>
              )}

              {/* Last Activity */}
              {conversation.updated_at && (
                <div className="bg-gray-50 dark:bg-[#1f2c33] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                  </div>
                  <p className="text-sm text-foreground">
                    {formatDistanceToNow(new Date(conversation.updated_at))} ago
                  </p>
                </div>
              )}

              {/* Active Status */}
              <div className="bg-gray-50 dark:bg-[#1f2c33] rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-foreground">Active</p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Participants (Group only) */}
          {isGroup && conversation.participants && conversation.participants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">{participantCount} Participants</h3>
                </div>
                {participantCount > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllParticipants(!showAllParticipants)}
                  >
                    {showAllParticipants ? "Show Less" : "Show All"}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {displayedParticipants?.map((participant, index) => {
                  const fullName = `${participant.first_name} ${participant.last_name}`;
                  const participantInitials = `${participant.first_name[0]}${participant.last_name[0]}`;

                  return (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1f2c33] hover:bg-gray-100 dark:hover:bg-[#2a3942] cursor-pointer transition-colors"
                      onClick={() => {
                        if (participant.id !== profile?.id) {
                          router.push(`/users/${participant.id}`);
                        }
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={participant.avatar_url} alt={fullName} />
                        <AvatarFallback className="bg-emerald-600 text-white">
                          {participantInitials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {fullName}
                          {participant.id === profile?.id && " (You)"}
                        </p>
                        {participant.user_type && (
                          <p className="text-sm text-muted-foreground capitalize">
                            {participant.user_type}
                          </p>
                        )}
                      </div>

                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="space-y-2 pt-4"
          >
            {isGroup ? (
              <>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-3" />
                  Group Settings
                </Button>
                <Button variant="destructive" className="w-full justify-start">
                  <LogOut className="h-4 w-4 mr-3" />
                  Leave Group
                </Button>
              </>
            ) : (
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="h-4 w-4 mr-3" />
                Add to Contacts
              </Button>
            )}
          </motion.div>
        </div>
      </ScrollArea>
    </div>
  );
}

