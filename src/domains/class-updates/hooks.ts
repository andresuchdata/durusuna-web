import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClassUpdates, getClassUpdate, addComment, addReaction, removeReaction, getClasses, getTeachers, ClassUpdateFilters } from "./api";

export function useClassUpdates(filters?: ClassUpdateFilters) {
  return useQuery({
    queryKey: ["class-updates", filters],
    queryFn: () => getClassUpdates(filters),
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: getClasses,
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: getTeachers,
  });
}

export function useClassUpdate(id: string) {
  return useQuery({
    queryKey: ["class-updates", id],
    queryFn: () => getClassUpdate(id),
    enabled: !!id,
  });
}

export function useAddComment(updateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => addComment(updateId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-updates", updateId] });
    },
  });
}

export function useAddReaction(updateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (emoji: string) => addReaction(updateId, emoji),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-updates", updateId] });
    },
  });
}

export function useRemoveReaction(updateId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reactionId: string) => removeReaction(updateId, reactionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-updates", updateId] });
    },
  });
}
