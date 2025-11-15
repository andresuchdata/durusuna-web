export interface SubjectSummary {
  id: string;
  name: string;
  subject_code?: string | null;
}

export interface SubjectsResponse {
  subjects: SubjectSummary[];
}
