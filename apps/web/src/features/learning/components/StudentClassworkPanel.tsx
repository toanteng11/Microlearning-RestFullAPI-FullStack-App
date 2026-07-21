import { BookOpen, Clock3, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../shared/auth/auth-context';
import { displayLearningDate, requestErrorMessage } from '../learning-format';
import type { ClassworkLesson, StudentClassworkEnvelope } from '../learning.types';
import { ProgressStatusBadge } from './LearningStatusBadge';

function LessonRow({ lesson }: { lesson: ClassworkLesson }) {
  return (
    <li className="classwork-lesson-row">
      <div>
        <Link to={`/student/lessons/${lesson.id}`}>{lesson.title}</Link>
        <small>
          <Clock3 size={14} /> {lesson.estimatedMinutes} phút · Hạn{' '}
          {displayLearningDate(lesson.completionDeadline)}
        </small>
      </div>
      <ProgressStatusBadge status={lesson.progress.derivedStatus} />
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
          {course.lessons.length > 0 ? (
            <ul className="classwork-lessons">
              {course.lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </ul>
          ) : null}
          {course.modules.map((module) => (
            <section className="classwork-module" id={`module-${module.id}`} key={module.id}>
              <h3>{module.title}</h3>
              {module.description ? <p>{module.description}</p> : null}
              <ul className="classwork-lessons">
                {module.lessons.map((lesson) => (
                  <LessonRow key={lesson.id} lesson={lesson} />
                ))}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}
