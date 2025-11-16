"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useProfile } from "@/domains/auth/hooks";
import { usePermissions } from "@/domains/access/hooks";
import { useClasses, useClassOfferings } from "@/domains/classes/hooks";
import { useAssessments, useReportCards, useGenerateReportCards } from "@/domains/grades/hooks";
import type { Class } from "@/domains/classes/types";
import type { ClassOfferingSummary } from "@/domains/classes/types";
import type { AssessmentSummary, ReportCardSummary } from "@/domains/grades/types";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText, ListChecks, GraduationCap } from "lucide-react";
import { AcademicPeriodSelector } from "@/components/academic/AcademicPeriodSelector";

type GradesTab = "assessments" | "report-cards";

function GradesHeader() {
  const { data: profile } = useProfile();
  const role = profile?.user_type;

  const pill =
    role === "teacher"
      ? "Teacher · Grades"
      : role === "student"
      ? "Student · Grades"
      : role === "parent"
      ? "Parent · Grades"
      : "Grades";

  const title =
    role === "parent"
      ? "Report cards and assessments"
      : "Grades and report cards";

  const subtitle =
    role === "parent"
      ? "Select a class and subject to see detailed assessments and report cards."
      : "Select a class and subject to explore assessments and report cards for the current period.";

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-sm">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{pill}</p>
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}

function ClassesAndOfferingsSelector(props: {
  classes: Class[];
  offerings?: ClassOfferingSummary[];
  selectedClassId?: string;
  onSelectClass: (id: string) => void;
  selectedOfferingId?: string;
  onSelectOffering: (id: string) => void;
}) {
  const {
    classes,
    offerings,
    selectedClassId,
    onSelectClass,
    selectedOfferingId,
    onSelectOffering,
  } = props;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Class</p>
        {classes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No classes available.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {classes.map((cls) => {
              const isActive = cls.id === selectedClassId;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClass(cls.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cls.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Subject</p>
        {!selectedClassId ? (
          <p className="text-xs text-muted-foreground">Select a class first.</p>
        ) : !offerings ? (
          <div className="flex gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
        ) : offerings.length === 0 ? (
          <p className="text-xs text-muted-foreground">No subjects found for this class.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {offerings.map((off) => {
              const isActive = off.class_offering_id === selectedOfferingId;
              return (
                <button
                  key={off.class_offering_id}
                  type="button"
                  onClick={() => onSelectOffering(off.class_offering_id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition-all ${
                    isActive
                      ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {off.subject_name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentsTable(props: { assessments: AssessmentSummary[]; isLoading: boolean }) {
  const { assessments, isLoading } = props;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No assessments for this subject in the current period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Max score</TableHead>
          <TableHead className="text-center">Published</TableHead>
          <TableHead className="text-right">Average</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assessments.map((a) => (
          <TableRow key={a.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-slate-900">{a.title}</span>
                {a.due_date && (
                  <span className="text-xs text-muted-foreground">Due: {new Date(a.due_date).toLocaleDateString()}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-xs capitalize text-muted-foreground">{a.type.replace("_", " ")}</TableCell>
            <TableCell className="text-right text-sm">{a.max_score}</TableCell>
            <TableCell className="text-center text-xs">
              {a.is_published ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  Draft
                </span>
              )}
            </TableCell>
            <TableCell className="text-right text-sm">
              {a.average_score != null ? a.average_score.toFixed(1) : "–"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ReportCardsTable(props: { reportCards: ReportCardSummary[]; isLoading: boolean }) {
  const { reportCards, isLoading } = props;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!reportCards || reportCards.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No report cards generated yet for this class and period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Generated at</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reportCards.map((rc) => (
          <TableRow key={rc.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">
                  {rc.student?.first_name} {rc.student?.last_name}
                </span>
                {rc.student?.student_number && (
                  <span className="text-xs text-muted-foreground">{rc.student.student_number}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-xs">
              <div className="flex flex-wrap gap-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    rc.is_published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  {rc.is_published ? "Published" : "Draft"}
                </span>
                {rc.is_locked && (
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                    Locked
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(rc.generated_at).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function GradesPage() {
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions();
  const permissions = permissionsResponse?.data;

  const classesQuery = useClasses();
  const classes = classesQuery.data ?? [];

  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | undefined>(undefined);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<GradesTab>("assessments");

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const offeringsQuery = useClassOfferings(selectedClassId, selectedPeriodId);
  const offerings = offeringsQuery.data?.offerings;

  useEffect(() => {
    if (!offerings || offerings.length === 0) {
      setSelectedOfferingId(undefined);
      return;
    }
    if (!selectedOfferingId) {
      setSelectedOfferingId(offerings[0].class_offering_id);
    } else if (!offerings.some((o) => o.class_offering_id === selectedOfferingId)) {
      setSelectedOfferingId(offerings[0].class_offering_id);
    }
  }, [offerings, selectedOfferingId]);

  const assessmentsParams = useMemo(
    () =>
      selectedOfferingId
        ? {
            class_offering_id: selectedOfferingId,
          }
        : undefined,
    [selectedOfferingId]
  );

  const assessmentsQuery = useAssessments(assessmentsParams);

  const reportCardsParams = useMemo(
    () =>
      selectedClassId && selectedPeriodId
        ? {
            class_id: selectedClassId,
            academic_period_id: selectedPeriodId,
          }
        : undefined,
    [selectedClassId, selectedPeriodId]
  );

  const reportCardsQuery = useReportCards(reportCardsParams);

  const generateReportCardsMutation = useGenerateReportCards();

  const canViewGrades = permissions?.canViewGrades ?? false;

  if (permissionsLoading || classesQuery.isLoading) {
    return (
      <AppLayout>
        <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">Loading grades…</div>
      </AppLayout>
    );
  }

  if (!permissions || !canViewGrades) {
    return (
      <AppLayout>
        <div className="container mx-auto p-4 md:p-6">
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              You do not have permission to view grades.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-sky-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8 space-y-6">
          <GradesHeader />

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Academic period</span>
              <AcademicPeriodSelector value={selectedPeriodId} onChange={setSelectedPeriodId} />
            </div>
            <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("assessments")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                  activeTab === "assessments"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ListChecks className="h-3.5 w-3.5" />
                <span>Assessments</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("report-cards")}
                className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${
                  activeTab === "report-cards"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report cards</span>
              </button>
            </div>
          </div>

          <Card className="border border-slate-200/80 bg-white/90 shadow-sm">
            <CardContent className="p-4 md:p-5 space-y-5">
              <ClassesAndOfferingsSelector
                classes={classes}
                offerings={offerings}
                selectedClassId={selectedClassId}
                onSelectClass={(id) => {
                  setSelectedClassId(id);
                  setSelectedOfferingId(undefined);
                }}
                selectedOfferingId={selectedOfferingId}
                onSelectOffering={setSelectedOfferingId}
              />

              {activeTab === "assessments" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" />
                      <span>Assessments for selected subject</span>
                    </div>
                  </div>
                  <AssessmentsTable
                    assessments={assessmentsQuery.data?.assessments ?? []}
                    isLoading={assessmentsQuery.isLoading}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>Report cards for selected class and period</span>
                    </div>
                    {selectedClassId && selectedPeriodId && (
                      <PermissionGuard requiredRole="admin" showFallback={false}>
                        <Button
                          size="sm"
                          onClick={() =>
                            generateReportCardsMutation.mutate({
                              class_id: selectedClassId,
                              academic_period_id: selectedPeriodId,
                            })
                          }
                          disabled={generateReportCardsMutation.isPending}
                        >
                          {generateReportCardsMutation.isPending ? "Generating…" : "Generate report cards"}
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                  <ReportCardsTable
                    reportCards={reportCardsQuery.data?.report_cards ?? []}
                    isLoading={reportCardsQuery.isLoading || generateReportCardsMutation.isPending}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
