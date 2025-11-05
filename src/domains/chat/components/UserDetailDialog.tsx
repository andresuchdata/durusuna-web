"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

interface UserDetailDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    user_type?: string;
  } | null;
  onSendMessage?: (userId: string) => void;
}

export function UserDetailDialog({ open, onClose, user, onSendMessage }: UserDetailDialogProps) {
  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = `${user.first_name[0]}${user.last_name[0]}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar_url} alt={fullName} />
              <AvatarFallback className="bg-emerald-600 text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Name */}
          <div className="text-center">
            <h3 className="text-xl font-semibold">{fullName}</h3>
            {user.user_type && (
              <p className="text-sm text-muted-foreground capitalize mt-1">
                {user.user_type}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="w-full space-y-3">
            {user.email && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1f2c33]"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm truncate">{user.email}</p>
                </div>
              </motion.div>
            )}

            {user.phone && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#1f2c33]"
              >
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{user.phone}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Actions */}
          <div className="w-full flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onSendMessage?.(user.id);
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" className="flex-1">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

