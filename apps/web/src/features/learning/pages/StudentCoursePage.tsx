import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { DerivedLearningStatus, StudentLessonSummary } from '../learning.types';
import { ProgressStatusBadge } from '../components/LearningStatusBadge';
import { ProgressBar } from '../components/ProgressBar';

interface CourseData {
  id: string;
  classroomId: string;
  title: string;
  description: string;
}

interface ModuleData {
  id: string;
  title: string;
  description: string;
}

interface ProgressItem {
  lessonId: string;
  title: string;
  completionDeadline: string | null;
  derivedStatus: DerivedLearningStatus;
}

export function StudentCoursePage() {
  const { courseId = '' } = useParams();
  const { request } = useAuth();
  const [data, setData] = useState<{
    course: CourseData;
    modules: ModuleData[];
    lessons: StudentLessonSummary[];
    progress: {
      summary: { requiredLessons: number; completedLessons: number; progressPercentage: number };
      items: ProgressItem[];
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      request<{ success: true; data: { course: CourseData } }>(`/courses/${courseId}`),
      request<{ success: true; data: { items: ModuleData[] } }>(`/courses/${courseId}/modules`),
      request<{ success: true; data: { items: StudentLessonSummary[] } }>(
        `/courses/${courseId}/lessons`,
      ),
      request<{
        success: true;
        data: {
          summary: {
            requiredLessons: number;
            completedLessons: number;
            progressPercentage: number;
          };
          items: ProgressItem[];
        };
      }>(`/students/me/progress?courseId=${courseId}`),
    ])
      .then(([course, modules, lessons, progress]) => {
        if (active)
          setData({
            course: course.data.course,
            modules: modules.data.items,
            lessons: lessons.data.items,
            progress: progress.data,
          });
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
  const progressMap = new Map(data.progress.items.map((item) => [item.lessonId, item]));
  const rootLessons = data.lessons.filter((lesson) => lesson.moduleId === null);

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
          <ProgressBar value={data.progress.summary.progressPercentage} label="Tiến độ khóa học" />
          <small>
            {data.progress.summary.completedLessons}/{data.progress.summary.requiredLessons} bài bắt
            buộc
          </small>
        </div>
      </header>
      {data.lessons.length === 0 ? (
        <div className="list-state">
          <BookOpen size={30} />
          <strong>Chưa có bài học</strong>
        </div>
      ) : (
        <div className="classwork-list">
          {rootLessons.length > 0 ? (
            <section className="classwork-module">
              <h2>Bài học chung</h2>
              <ul className="classwork-lessons">
                {rootLessons.map((lesson) => {
                  const progress = progressMap.get(lesson.id);
                  return (
                    <li className="classwork-lesson-row" key={lesson.id}>
                      <div>
                        <Link to={`/student/lessons/${lesson.id}`}>{lesson.title}</Link>
                        <small>Hạn {displayLearningDate(lesson.completionDeadline)}</small>
                      </div>
                      {progress ? <ProgressStatusBadge status={progress.derivedStatus} /> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {data.modules.map((module) => (
            <section className="classwork-module" id={`module-${module.id}`} key={module.id}>
              <h2>{module.title}</h2>
              {module.description ? <p>{module.description}</p> : null}
              <ul className="classwork-lessons">
                {data.lessons
                  .filter((lesson) => lesson.moduleId === module.id)
                  .map((lesson) => {
                    const progress = progressMap.get(lesson.id);
                    return (
                      <li className="classwork-lesson-row" key={lesson.id}>
                        <div>
                          <Link to={`/student/lessons/${lesson.id}`}>{lesson.title}</Link>
                          <small>Hạn {displayLearningDate(lesson.completionDeadline)}</small>
                        </div>
                        {progress ? <ProgressStatusBadge status={progress.derivedStatus} /> : null}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      )}
      {data.progress.summary.completedLessons === data.progress.summary.requiredLessons &&
      data.progress.summary.requiredLessons > 0 ? (
        <div className="notice notice--success">
          <CheckCircle2 size={17} /> Bạn đã hoàn thành toàn bộ bài học bắt buộc.
        </div>
      ) : null}
    </section>
  );
}
