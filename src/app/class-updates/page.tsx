"use client";

import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useClassUpdates, useClasses, useTeachers } from "@/domains/class-updates/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, ChevronUp, Send, Bookmark, Search, Filter, X, Plus, MoreVertical, Edit, Trash2, Pin, PinOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateClassUpdateDialog } from "@/components/class-updates/CreateClassUpdateDialog";
import { EditClassUpdateDialog } from "@/components/class-updates/EditClassUpdateDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfile } from "@/domains/auth/hooks";
import { MediaViewer, MediaThumbnailGrid, type MediaItem } from "@/components/media/MediaViewer";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ClassUpdate, Comment } from "@/domains/class-updates/types";
import { addReaction, addComment, getComments, ClassUpdateFilters, deleteClassUpdate, togglePinClassUpdate } from "@/domains/class-updates/api";

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

// Searchable Teacher Filter Dropdown Component
function TeacherFilterDropdown({ 
  teachers, 
  selectedTeacherId, 
  onSelect 
}: { 
  teachers?: Array<{ id: string; name: string }>;
  selectedTeacherId?: string;
  onSelect: (teacherId: string | undefined) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    if (!searchQuery) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [teachers, searchQuery]);

  const selectedTeacher = teachers?.find(t => t.id === selectedTeacherId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs bg-white border-gray-200 hover:bg-gray-50">
          <Filter className="h-3 w-3 mr-1" />
          {selectedTeacher ? selectedTeacher.name : 'Teacher'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-white">
        <DropdownMenuLabel className="text-xs">Filter by Teacher</DropdownMenuLabel>
        <div className="px-2 pb-2">
          <Input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-48 overflow-y-auto">
          <DropdownMenuItem 
            onClick={() => {
              onSelect(undefined);
              setSearchQuery("");
              setOpen(false);
            }} 
            className="text-xs"
          >
            All Teachers
          </DropdownMenuItem>
          {filteredTeachers.length > 0 ? (
            filteredTeachers.map((teacher) => (
              <DropdownMenuItem
                key={teacher.id}
                onClick={() => {
                  onSelect(teacher.id);
                  setSearchQuery("");
                  setOpen(false);
                }}
                className="text-xs"
              >
                {teacher.name}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              No teachers found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ClassUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ClassUpdateFilters>({});
  const [activeFilters, setActiveFilters] = useState<ClassUpdateFilters>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: profile } = useProfile();

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Apply search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine active filters with search
  const queryFilters = useMemo(() => ({
    ...activeFilters,
    search: debouncedSearch || undefined,
  }), [activeFilters, debouncedSearch]);

  const { data, isLoading, error, refetch } = useClassUpdates(queryFilters);
  const { data: classes, isLoading: isLoadingClasses } = useClasses();
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers();

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({});
    setActiveFilters({});
  };

  const applyFilter = (key: keyof ClassUpdateFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setActiveFilters(newFilters);
  };

  const updateTypes = [
    { value: 'announcement', label: 'Announcement' },
    { value: 'homework', label: 'Homework' },
    { value: 'reminder', label: 'Reminder' },
    { value: 'event', label: 'Event' },
  ];

  const handleCreateSuccess = () => {
    refetch();
  };

  // Check if user is a teacher (can create updates)
  const canCreateUpdate = profile?.user_type !== 'student';

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-full md:max-w-3xl">
        <div className="mb-4">
          <h1 className="text-xl md:text-2xl font-bold">Class Updates</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Stay updated with your school community</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 bg-white border-gray-200 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns - Compact Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Filters:</span>
            
            {/* Class Filter */}
            {isLoadingClasses ? (
              <Skeleton className="h-7 w-16 rounded-md" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-white border-gray-200 hover:bg-gray-50">
                    <Filter className="h-3 w-3 mr-1" />
                    {filters.class_id ? classes?.find(c => c.id === filters.class_id)?.name : 'Class'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 bg-white">
                  <DropdownMenuLabel className="text-xs">Filter by Class</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => applyFilter('class_id', undefined)} className="text-xs">
                    All Classes
                  </DropdownMenuItem>
                  {classes?.map((cls) => (
                    <DropdownMenuItem
                      key={cls.id}
                      onClick={() => applyFilter('class_id', cls.id)}
                      className="text-xs"
                    >
                      {cls.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Teacher Filter with Search */}
            {isLoadingTeachers ? (
              <Skeleton className="h-7 w-20 rounded-md" />
            ) : (
              <TeacherFilterDropdown 
                teachers={teachers}
                selectedTeacherId={filters.author_id}
                onSelect={(teacherId) => applyFilter('author_id', teacherId)}
              />
            )}

            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-white border-gray-200 hover:bg-gray-50">
                  <Filter className="h-3 w-3 mr-1" />
                  {filters.update_type ? updateTypes.find(t => t.value === filters.update_type)?.label : 'Type'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 bg-white">
                <DropdownMenuLabel className="text-xs">Filter by Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyFilter('update_type', undefined)} className="text-xs">
                  All Types
                </DropdownMenuItem>
                {updateTypes.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => applyFilter('update_type', type.value as 'announcement' | 'homework' | 'reminder' | 'event')}
                    className="text-xs"
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-gray-500 hover:text-gray-700">
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {/* Filter Bar Skeleton */}
            <div className="mb-4 space-y-2">
              {/* Search Input Skeleton */}
              <div className="relative">
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              
              {/* Filter Dropdowns Skeleton */}
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-4 w-12" /> {/* "Filters:" text */}
                <Skeleton className="h-7 w-16 rounded-md" /> {/* Class filter */}
                <Skeleton className="h-7 w-20 rounded-md" /> {/* Teacher filter */}
                <Skeleton className="h-7 w-14 rounded-md" /> {/* Type filter */}
              </div>
            </div>

            {/* Class Update Cards Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Header Section */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-32" /> {/* Author name */}
                            <Skeleton className="h-3 w-20" /> {/* Date */}
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" /> {/* Badge */}
                            <Skeleton className="h-8 w-8 rounded" /> {/* Menu button */}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title and Class Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-6 w-48" /> {/* Title */}
                      <Skeleton className="h-5 w-20 rounded-full" /> {/* Class badge */}
                    </div>

                    {/* Content */}
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>

                  {/* Media Preview Skeleton */}
                  {i % 3 === 0 && ( // Show media skeleton for some cards
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-32 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    </div>
                  )}

                  {/* Actions Section */}
                  <div className="p-4 border-t border-border">
                    {/* Reactions Skeleton */}
                    {i % 2 === 0 && ( // Show reactions skeleton for some cards
                      <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-6 w-10 rounded-full" />
                        <Skeleton className="h-6 w-14 rounded-full" />
                      </div>
                    )}

                    {/* Comment Count Skeleton */}
                    <div className="mb-3">
                      <Skeleton className="h-4 w-24" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 md:gap-2">
                      <Skeleton className="h-8 flex-1 rounded-md" /> {/* React */}
                      <Skeleton className="h-8 flex-1 rounded-md" /> {/* Comment */}
                      <Skeleton className="h-8 flex-1 rounded-md" /> {/* Share */}
                      <Skeleton className="h-8 flex-1 rounded-md" /> {/* Save */}
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
              <ClassUpdateCard key={update.id} update={update} onUpdate={refetch} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No updates yet.</p>
            <p className="text-sm mt-2">Check back later for announcements and updates</p>
          </div>
        )}

        {/* Floating Action Button */}
        {canCreateUpdate && (
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-40"
            aria-label="Create class update"
          >
            <Plus className="h-6 w-6" />
          </button>
        )}

        {/* Create Dialog */}
        <CreateClassUpdateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
          classes={classes}
        />
      </div>
    </AppLayout>
  );
}

// Class Update Card Component
function ClassUpdateCard({ update, onUpdate }: { update: ClassUpdate; onUpdate?: () => void }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: profile } = useProfile();
  
  const initials = (update.author.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const mediaItems: MediaItem[] = update.attachments?.map(att => ({
    id: att.id,
    name: att.name,
    url: att.url,
    type: att.type,
    size: att.size,
  })) || [];
  
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
      setComments(prev => [comment, ...(Array.isArray(prev) ? prev : [])]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteClassUpdate(update.id);
      setShowDeleteDialog(false);
      onUpdate?.(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete update:', error);
      alert('Failed to delete update. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const handleEditClick = () => {
    setShowMenu(false);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    onUpdate?.(); // Refresh the list
  };

  // Handle pin/unpin
  const handleTogglePin = async () => {
    setIsPinning(true);
    try {
      await togglePinClassUpdate(update.id, !update.isPinned);
      onUpdate?.(); // Refresh the list
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      alert('Failed to pin/unpin update. Please try again.');
    } finally {
      setIsPinning(false);
      setShowMenu(false);
    }
  };

  // Check if current user is the author
  const isAuthor = profile?.id === update.author.id;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Pinned Indicator */}
        {update.isPinned && (
          <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center gap-2">
            <Pin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Pinned</span>
          </div>
        )}
        
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={update.author.avatar} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{update.author.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(update.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {update.updateType && (
                    <Badge 
                      variant={
                        update.updateType === 'homework' ? 'destructive' :
                        update.updateType === 'event' ? 'default' :
                        update.updateType === 'reminder' ? 'outline' :
                        'secondary'
                      }
                      className="text-xs capitalize"
                    >
                      {update.updateType}
                    </Badge>
                  )}
                  
                  {/* Three-dot menu (author only) */}
                  {isAuthor && (
                    <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleTogglePin} disabled={isPinning}>
                          {update.isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-2" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleEditClick}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDeleteClick}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
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
        {mediaItems.length > 0 && (
          <div className="relative">
            <MediaThumbnailGrid
              items={mediaItems}
              onItemClick={(index) => {
                setMediaViewerIndex(index);
                setMediaViewerOpen(true);
              }}
            />
          </div>
        )}
        
        {/* Debug: Show if attachments exist but not displaying */}
        {update.attachments && update.attachments.length > 0 && mediaItems.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
            Debug: {update.attachments.length} attachment(s) found but not displaying. Check console.
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
          <div className="flex items-center gap-1 md:gap-2">
            {/* TODO: Replace with Popover component when available */}
            <div className="relative flex-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
                onClick={() => setShowReactionPopover(!showReactionPopover)}
              >
                <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">React</span>
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
              className="flex-1 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
              onClick={handleLoadComments}
              disabled={isLoadingComments}
            >
              <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Comment</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Share2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Bookmark className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Save</span>
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

        {/* Media Viewer */}
        <MediaViewer
          items={mediaItems}
          initialIndex={mediaViewerIndex}
          open={mediaViewerOpen}
          onOpenChange={setMediaViewerOpen}
        />
      </CardContent>

      {/* Edit Dialog */}
      <EditClassUpdateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
        update={update}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this update? This action cannot be undone.
              {update.title && (
                <span className="block mt-2 font-semibold text-foreground">
                  &ldquo;{update.title}&rdquo;
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
