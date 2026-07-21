export interface ContentGovernanceSummary {
  classroomId: string;
  courseCount: number;
  lessonCount: number;
  announcementCount: number;
  lastContentUpdatedAt: string | null;
}

export interface ClassroomContentReader {
  countByClassroomIds(ids: readonly string[]): Promise<ReadonlyMap<string, number>>;
  getGovernanceSummary(classroomId: string): Promise<ContentGovernanceSummary>;
}
