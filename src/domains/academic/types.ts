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

export interface AcademicPeriodWithYearSummary extends AcademicPeriodSummary {
  is_current: boolean;
  academic_year: AcademicYearSummary;
}

export interface CurrentAcademicPeriodResponse {
  academic_year: AcademicYearSummary;
  current_period: AcademicPeriodSummary;
}

export interface AcademicPeriodsResponse {
  academic_periods: AcademicPeriodWithYearSummary[];
}
