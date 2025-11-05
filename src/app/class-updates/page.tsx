"use client";

import { Suspense, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useClassUpdates } from "@/domains/class-updates/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, ChevronDown, ChevronUp, Send, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input"; // TODO: Add popover and scroll-area components
import type { ClassUpdate, Comment } from "@/domains/class-updates/types";
import { addReaction, addComment, getComments } from "@/domains/class-updates/api";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ClassUpdatesPage() {
  const { data, isLoading, error, refetch } = useClassUpdates();

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-full md:max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Class Updates</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your school community</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  <Skeleton className="h-64 w-full" />
                  <div className="p-4">
                    <div className="flex gap-6">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">Failed to load class updates</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((update) => (
              <ClassUpdateCard key={update.id} update={update} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No updates yet.</p>
            <p className="text-sm mt-2">Check back later for announcements and updates</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Class Update Card Component
function ClassUpdateCard({ update }: { update: ClassUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const initials = (update.author.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasMedia = update.attachments && update.attachments.length > 0;
  const imageAttachments = update.attachments?.filter(a => a.type.startsWith('image/')) || [];
  // Calculate total reaction count from all emoji types
  const reactionCount = update.reactions?.reduce((sum, r) => sum + 1, 0) || 0;
  const commentCount = update.comments?.length || 0;
  
  // Group reactions by emoji
  const reactionGroups = update.reactions?.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof update.reactions>);

  // Check if current user has reacted with specific emoji
  const hasUserReacted = (emoji: string) => {
    return update.reactions?.some(r => r.emoji === emoji && r.userId === 'current-user');
  };

  // Common emojis for reactions
  const commonEmojis = ['❤️', '👍', '😊', '🎉', '🤔', '😂', '👏', '🔥'];

  // Handle adding reaction
  const handleAddReaction = async (emoji: string) => {
    if (isSubmittingReaction) return;
    
    setIsSubmittingReaction(true);
    try {
      await addReaction(update.id, emoji);
      // TODO: Update local state or refetch
      setShowReactionPopover(false);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  // Handle clicking existing reaction
  const handleReactionClick = async (emoji: string) => {
    if (hasUserReacted(emoji)) {
      // Remove reaction if already reacted
      // TODO: Implement remove reaction
    } else {
      // Add reaction if not yet reacted
      await handleAddReaction(emoji);
    }
  };

  // Handle loading comments
  const handleLoadComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const commentsData = await getComments(update.id);
      setComments(commentsData);
      setShowComments(true);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Handle submitting comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const comment = await addComment(update.id, newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={update.author.avatar} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{update.author.name}</h3>
              <p className="text-xs text-muted-foreground">{formatDate(update.createdAt)}</p>
            </div>
          </div>

          {/* Title with Class Badge */}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">{update.title}</h2>
            {update.className && (
              <Badge variant="secondary" className="text-xs">
                {update.className}
              </Badge>
            )}
          </div>

          {/* Content with basic formatting */}
          <div className="text-sm text-foreground prose prose-sm max-w-none dark:prose-invert">
            {update.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Media Preview */}
        {imageAttachments.length > 0 && (
          <div className="relative bg-gray-100 dark:bg-gray-800">
            {imageAttachments.length === 1 ? (
              <img
                src={imageAttachments[0].url}
                alt={imageAttachments[0].name}
                className="w-full h-auto max-h-96 object-cover"
              />
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {imageAttachments.slice(0, 4).map((img, idx) => (
                  <div key={img.id} className="relative aspect-square">
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    {idx === 3 && imageAttachments.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">+{imageAttachments.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-border">
          {/* Reaction Display */}
          {reactionGroups && Object.keys(reactionGroups).length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {Object.entries(reactionGroups).map(([emoji, reactions]) => (
                <div
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors cursor-pointer text-sm ${
                    hasUserReacted(emoji) 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs">{reactions.length}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Comment Count */}
          {commentCount > 0 && (
            <div className="text-sm text-muted-foreground mb-3">
              <span>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* TODO: Replace with Popover component when available */}
            <div className="relative flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => setShowReactionPopover(!showReactionPopover)}
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm">React</span>
              </Button>
              {showReactionPopover && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-background border rounded-lg shadow-lg z-10">
                  <div className="grid grid-cols-4 gap-1">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleAddReaction(emoji)}
                        disabled={isSubmittingReaction}
                        className="text-2xl p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleLoadComments}
              disabled={isLoadingComments}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2">
              <Bookmark className="h-4 w-4" />
              <span className="text-sm">Save</span>
            </Button>
          </div>

          {/* Comments Panel */}
          {showComments && (
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Comments</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowComments(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Comment Input */}
              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={isSubmittingComment}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim() || isSubmittingComment}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-muted-foreground">Loading comments...</div>
                </div>
              ) : comments.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.author?.avatar} />
                        <AvatarFallback className="text-xs">
                          {comment.author?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author?.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm break-words">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
