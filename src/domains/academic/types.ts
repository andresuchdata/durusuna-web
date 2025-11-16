export interface AcademicYearSummary {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export interface AcademicPeriodSummary {
  id: string;
  name: string;
  sequence: number;
  start_date: string;
  end_date: string;
}

export interface CurrentAcademicPeriodResponse {
  academic_year: AcademicYearSummary;
  current_period: AcademicPeriodSummary;
}
