import { type Card } from '../types';
import Icon from './Icon';

type CardTileProps = {
  card: Card
  onEdit: () => void
  onDelete: () => void
  onScore: (delta: number) => void
}

export default function CardTile({ card, onEdit, onDelete, onScore }: CardTileProps) {
  const score = card.score ?? 0;
  const chipTone = score > 0
    ? 'bg-good/20 text-good-700'
    : score < 0
      ? 'bg-bad/15 text-bad-700'
      : 'bg-ink-700/5 text-ink-500';

  return (
    <div className="bg-white border border-ink-700/10 rounded-[14px] shadow-soft flex flex-col transition-all hover:shadow-pop hover:-translate-y-0.5">
      <div className={`aspect-square relative grid place-items-center overflow-hidden rounded-t-[13px] ${card.imgBase64 ? 'bg-cream-100' : 'bg-stripes bg-cream-200'}`}>
        {card.imgBase64
          ? <img src={card.imgBase64} alt={card.word} className="max-w-full max-h-full w-auto h-auto object-contain block" />
          : <div className="text-ink-300 font-mono text-[11px]">{card.word}</div>}
      </div>
      <div className="px-3.5 pt-3 pb-3.5 flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2 font-display font-bold text-lg tracking-tight leading-tight">
          <span>{card.word}</span>
          <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-medium px-1.5 py-[3px] rounded-full ${chipTone}`}>
            {score > 0 ? '+' : ''}{score}
          </span>
        </div>
        <div className="text-[13px] text-ink-300 mt-0.5">{card.translation}</div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1">
            <button title="Thumbs down" onClick={() => onScore(-1)}
              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-bad/10 text-bad-700 grid place-items-center hover:bg-bad/20">
              <Icon name="thumb-down" size={13} />
            </button>
            <button title="Thumbs up" onClick={() => onScore(1)}
              className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-good/20 text-good-700 grid place-items-center hover:bg-good/30">
              <Icon name="thumb-up" size={13} />
            </button>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} title="Edit"
              className="w-7 h-7 rounded-lg grid place-items-center bg-transparent border-0 cursor-pointer text-ink-300 hover:bg-ink-700/5 hover:text-ink-700">
              <Icon name="edit" size={14} />
            </button>
            <button onClick={onDelete} title="Delete"
              className="w-7 h-7 rounded-lg grid place-items-center bg-transparent border-0 cursor-pointer text-ink-300 hover:bg-ink-700/5 hover:text-ink-700">
              <Icon name="trash" size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
