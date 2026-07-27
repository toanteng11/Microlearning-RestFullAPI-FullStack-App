import {
  ArrowLeft,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type {
  ClassworkActivity,
  ClassworkCourse,
  StudentClassworkEnvelope,
} from '../learning.types';
import { ProgressStatusBadge } from '../components/LearningStatusBadge';
import { ProgressBar } from '../components/ProgressBar';

interface CourseData {
  id: string;
  classroomId: string;
  title: string;
  description: string;
}

interface ProgressData {
  metricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1';
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
  summary: {
    requiredActivities: number;
    completedActivities: number;
    requiredLessons: number;
    completedLessons: number;
    progressPercentage: number | null;
  };
}

function ActivityIcon({ type }: { type: ClassworkActivity['activityType'] }) {
  if (type === 'QUIZ') return <ClipboardList size={18} aria-hidden="true" />;
  if (type === 'ASSIGNMENT') return <FileText size={18} aria-hidden="true" />;
  return <BookOpen size={18} aria-hidden="true" />;
}

function ActivityRow({ activity }: { activity: ClassworkActivity }) {
  return (
    <li className="classwork-lesson-row">
      <ActivityIcon type={activity.activityType} />
      <div>
        <Link to={activity.actionUrl}>{activity.title}</Link>
        <small>
          {activity.activityType === 'LESSON'
            ? 'Bài học'
            : activity.activityType === 'QUIZ'
              ? 'Bài kiểm tra'
              : 'Bài tập'}{' '}
          · Hạn {displayLearningDate(activity.effectiveDeadline)}
          {activity.hasDeadlineException ? (
            <>
              {' '}
              · <CalendarPlus size={14} /> Đã gia hạn
            </>
          ) : null}
        </small>
      </div>
      <ProgressStatusBadge status={activity.progress.derivedStatus} />
    </li>
  );
}

export function StudentCoursePage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const [data, setData] = useState<{
    course: CourseData;
    classwork: ClassworkCourse;
    progress: ProgressData;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void request<{ success: true; data: { course: CourseData } }>(`/courses/${courseId}`)
      .then(async (courseResponse) => {
        const [classworkResponse, progressResponse] = await Promise.all([
          request<StudentClassworkEnvelope>(
            `/classrooms/${courseResponse.data.course.classroomId}/classwork`,
          ),
          request<{ success: true; data: ProgressData }>(
            `/students/me/progress?courseId=${courseId}`,
          ),
        ]);
        const classwork = classworkResponse.data.courses.find((item) => item.id === courseId);
        if (!classwork) throw new Error('Course is not visible in classwork');
        if (active) {
          setData({
            course: courseResponse.data.course,
            classwork,
            progress: progressResponse.data,
          });
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải khóa học.'));
      });
    return () => {
      active = false;
    };
  }, [courseId, request]);

  if (error) return <div className="list-state list-state--error">{error}</div>;
  if (!data)
    return (
      <div className="list-state">
        <div className="spinner" />
      </div>
    );

  const allActivities = [
    ...data.classwork.activities,
    ...data.classwork.modules.flatMap((module) => module.activities),
  ];
  const percentage = data.progress.summary.progressPercentage ?? 0;

  return (
    <section className="page-section">
      <Link
        className="back-link"
        to={`/student/classrooms/${data.course.classroomId}?tab=classwork`}
      >
        <ArrowLeft size={17} /> Quay lại lớp học
      </Link>
      <header className="page-header page-header--aligned">
        <div>
          <p className="eyebrow">Khóa học</p>
          <h1>{data.course.title}</h1>
          <p>{data.course.description || 'Chưa có mô tả.'}</p>
        </div>
        <div className="course-progress-summary">
          <ProgressBar value={percentage} label="Tiến độ khóa học" />
          <small>
            {data.progress.summary.completedActivities}/{data.progress.summary.requiredActivities}{' '}
            hoạt động bắt buộc
          </small>
        </div>
      </header>
      {allActivities.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Chưa có hoạt động học tập</strong>
        </div>
      ) : (
        <div className="classwork-list">
          {data.classwork.activities.length > 0 ? (
            <section className="classwork-module">
              <h2>Hoạt động chung</h2>
              <ul className="classwork-lessons">
                {data.classwork.activities.map((activity) => (
                  <ActivityRow
                    key={`${activity.activityType}-${activity.id}`}
                    activity={activity}
                  />
                ))}
              </ul>
            </section>
          ) : null}
          {data.classwork.modules.map((module) => (
            <section className="classwork-module" id={`module-${module.id}`} key={module.id}>
              <h2>{module.title}</h2>
              {module.description ? <p>{module.description}</p> : null}
              {module.activities.length === 0 ? (
                <p className="field-help">Chưa có hoạt động được xuất bản.</p>
              ) : (
                <ul className="classwork-lessons">
                  {module.activities.map((activity) => (
                    <ActivityRow
                      key={`${activity.activityType}-${activity.id}`}
                      activity={activity}
                    />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {data.progress.summary.completedActivities === data.progress.summary.requiredActivities &&
      data.progress.summary.requiredActivities > 0 ? (
        <div className="notice notice--success">
          <CheckCircle2 size={17} /> Bạn đã hoàn thành toàn bộ hoạt động bắt buộc.
        </div>
      ) : null}
    </section>
  );
}
