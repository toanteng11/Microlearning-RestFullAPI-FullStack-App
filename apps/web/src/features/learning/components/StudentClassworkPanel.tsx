import { BookOpen, CalendarPlus, ClipboardList, FileText, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ClassworkActivity, StudentClassworkEnvelope } from '../learning.types';
import { ProgressStatusBadge } from './LearningStatusBadge';

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

export function StudentClassworkPanel({ classroomId }: { classroomId: string }) {
  const { request } = useAuth();
  const [result, setResult] = useState<StudentClassworkEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void request<StudentClassworkEnvelope>(`/classrooms/${classroomId}/classwork`)
      .then((response) => {
        if (active) {
          setResult(response);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestErrorMessage(requestError, 'Không thể tải nội dung khóa học.'));
      });
    return () => {
      active = false;
    };
  }, [classroomId, reloadKey, request]);

  if (error) {
    return (
      <div className="list-state list-state--error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw size={17} /> Thử lại
        </button>
      </div>
    );
  }
  if (!result)
    return (
      <div className="list-state">
        <div className="spinner" />
        <p>Đang tải nội dung...</p>
      </div>
    );
  if (result.data.courses.length === 0) {
    return (
      <div className="list-state">
        <BookOpen size={30} />
        <strong>Chưa có khóa học được xuất bản</strong>
      </div>
    );
  }

  return (
    <div className="classwork-list">
      {result.data.courses.map((course) => (
        <section className="classwork-course" key={course.id}>
          <header>
            <div>
              <h2>
                <Link to={`/student/courses/${course.id}`}>{course.title}</Link>
              </h2>
              {course.description ? <p>{course.description}</p> : null}
            </div>
          </header>
          {course.activities.length > 0 ? (
            <ul className="classwork-lessons">
              {course.activities.map((activity) => (
                <ActivityRow key={`${activity.activityType}-${activity.id}`} activity={activity} />
              ))}
            </ul>
          ) : null}
          {course.modules.map((module) => (
            <section className="classwork-module" id={`module-${module.id}`} key={module.id}>
              <h3>{module.title}</h3>
              {module.description ? <p>{module.description}</p> : null}
              <ul className="classwork-lessons">
                {module.activities.map((activity) => (
                  <ActivityRow
                    key={`${activity.activityType}-${activity.id}`}
                    activity={activity}
                  />
                ))}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}
