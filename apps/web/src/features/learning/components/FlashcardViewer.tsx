import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import type { Flashcard } from '../learning.types';

export function FlashcardViewer({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  if (cards.length === 0) return null;
  const card = cards[index]!;

  function move(nextIndex: number) {
    setIndex(nextIndex);
    setShowBack(false);
  }

  return (
    <section className="flashcard-tool" aria-labelledby="flashcard-title">
      <div className="section-heading">
        <h2 id="flashcard-title">Thẻ ghi nhớ</h2>
        <span>
          {index + 1} / {cards.length}
        </span>
      </div>
      <button
        className="flashcard-viewer"
        type="button"
        aria-pressed={showBack}
        onClick={() => setShowBack((current) => !current)}
      >
        <span>{showBack ? 'Mặt sau' : 'Mặt trước'}</span>
        <div
          className="safe-rich-text"
          dangerouslySetInnerHTML={{ __html: showBack ? card.backHtml : card.frontHtml }}
        />
        <small>
          <RotateCcw size={15} /> Nhấn Enter, Space hoặc bấm để lật
        </small>
      </button>
      <div className="flashcard-controls">
        <button
          className="secondary-button"
          type="button"
          disabled={index === 0}
          onClick={() => move(index - 1)}
        >
          <ArrowLeft size={17} /> Thẻ trước
        </button>
        <button
          className="secondary-button"
          type="button"
          disabled={index === cards.length - 1}
          onClick={() => move(index + 1)}
        >
          Thẻ sau <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
