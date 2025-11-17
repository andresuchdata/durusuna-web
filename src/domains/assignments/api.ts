import { http } from "@/core/http/axios";
import type {
  AssignmentDetailsResponse,
  AssignmentListQueryParams,
  AssignmentsListResponse,
  CreateAssignmentPayload,
  CreateAssignmentResponse,
  TeacherAccessibleClassesResponse,
  TeacherAccessibleSubjectsResponse,
} from "./types";

export async function fetchUserAssignments(
  params: AssignmentListQueryParams = {}
): Promise<AssignmentsListResponse> {
  const res = await http().get("/assignments/user/assignments", { params });
  return res.data as AssignmentsListResponse;
}

export async function fetchAssignmentDetails(
  assignmentId: string
): Promise<AssignmentDetailsResponse> {
  const res = await http().get(`/assignments/${assignmentId}/details`);
  return res.data as AssignmentDetailsResponse;
}

export async function fetchTeacherAccessibleSubjects(): Promise<TeacherAccessibleSubjectsResponse> {
  const res = await http().get("/assignments/teacher/accessible-subjects");
  return res.data as TeacherAccessibleSubjectsResponse;
}

export async function fetchTeacherAccessibleClasses(): Promise<TeacherAccessibleClassesResponse> {
  const res = await http().get("/assignments/teacher/accessible-classes");
  return res.data as TeacherAccessibleClassesResponse;
}

export async function createAssignmentForClassSubject(
  classId: string,
  subjectId: string,
  payload: CreateAssignmentPayload
): Promise<CreateAssignmentResponse> {
  const res = await http().post(
    `/assignments/classes/${classId}/subjects/${subjectId}/assignments`,
    payload
  );
  return res.data as CreateAssignmentResponse;
}
