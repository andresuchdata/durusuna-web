"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssessments,
  fetchAssessmentGrades,
  fetchReportCards,
  fetchReportCardDetail,
  generateReportCards,
} from "./api";
import type {
  AssessmentQueryParams,
  AssessmentsResponse,
  AssessmentGradesQueryParams,
  AssessmentGradesResponse,
  ReportCardsListParams,
  ReportCardsListResponse,
  ReportCardDetail,
  GenerateReportCardsPayload,
  GenerateReportCardsResponse,
} from "./types";

export function useAssessments(params: AssessmentQueryParams | undefined) {
  return useQuery<AssessmentsResponse>({
    queryKey: ["assessments", params],
    queryFn: () => fetchAssessments(params ?? {}),
    enabled: !!params && !!params.class_offering_id,
    staleTime: 30_000,
  });
}

export function useAssessmentGrades(
  assessmentId: string | undefined,
  params: AssessmentGradesQueryParams | undefined
) {
  return useQuery<AssessmentGradesResponse>({
    queryKey: ["assessments", assessmentId, "grades", params],
    queryFn: () => fetchAssessmentGrades(assessmentId!, params ?? {}),
    enabled: !!assessmentId,
    staleTime: 30_000,
  });
}

export function useReportCards(params: ReportCardsListParams | undefined) {
  return useQuery<ReportCardsListResponse>({
    queryKey: ["report-cards", params],
    queryFn: () => fetchReportCards(params!),
    enabled: !!params && !!params.class_id && !!params.academic_period_id,
    staleTime: 30_000,
  });
}

export function useReportCardDetail(reportCardId: string | undefined) {
  return useQuery<ReportCardDetail>({
    queryKey: ["report-cards", reportCardId],
    queryFn: () => fetchReportCardDetail(reportCardId!),
    enabled: !!reportCardId,
    staleTime: 60_000,
  });
}

export function useGenerateReportCards() {
  const qc = useQueryClient();
  return useMutation<GenerateReportCardsResponse, unknown, GenerateReportCardsPayload>({
    mutationFn: (payload) => generateReportCards(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["report-cards"] });
      qc.invalidateQueries({
        queryKey: ["report-cards", {
          class_id: variables.class_id,
          academic_period_id: variables.academic_period_id,
        }],
      });
    },
  });
}
