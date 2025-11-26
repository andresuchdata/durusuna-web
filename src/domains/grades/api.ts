import { http } from "@/core/http/axios";
import type {
  AssessmentQueryParams,
  AssessmentsResponse,
  AssessmentGradesQueryParams,
  AssessmentGradesResponse,
  CreateAssessmentPayload,
  UpdateAssessmentPayload,
  ReportCardsListParams,
  ReportCardsListResponse,
  ReportCardDetail,
  GenerateReportCardsPayload,
  GenerateReportCardsResponse,
} from "./types";

export async function fetchAssessments(
  params: AssessmentQueryParams = {}
): Promise<AssessmentsResponse> {
  const res = await http().get("/assessments", { params });
  return res.data as AssessmentsResponse;
}

export async function fetchAssessmentGrades(
  assessmentId: string,
  params: AssessmentGradesQueryParams = {}
): Promise<AssessmentGradesResponse> {
  const res = await http().get(`/assessments/${assessmentId}/grades`, { params });
  return res.data as AssessmentGradesResponse;
}

export async function createAssessment(
  payload: CreateAssessmentPayload
) {
  const res = await http().post("/assessments", payload);
  return res.data;
}

export async function updateAssessment(
  assessmentId: string,
  payload: UpdateAssessmentPayload
) {
  const res = await http().patch(`/assessments/${assessmentId}`, payload);
  return res.data;
}

export async function fetchReportCards(
  params: ReportCardsListParams
): Promise<ReportCardsListResponse> {
  const res = await http().get("/report-cards", { params });
  return res.data as ReportCardsListResponse;
}

export async function fetchReportCardDetail(
  reportCardId: string
): Promise<ReportCardDetail> {
  const res = await http().get(`/report-cards/${reportCardId}`);
  return res.data.report_card as ReportCardDetail;
}

export async function generateReportCards(
  payload: GenerateReportCardsPayload
): Promise<GenerateReportCardsResponse> {
  const res = await http().post("/report-cards/generate", payload);
  return res.data as GenerateReportCardsResponse;
}
