import Icon from '../components/Icon';

type EmptyStateViewProps = {
  onCreate: () => void
}

function HeroCard({ className, en, it }: { className: string; en: string; it: string }) {
  return (
    <div className={`absolute left-1/2 top-1/2 w-[260px] h-[340px] rounded-3xl border border-ink-700/10 p-[18px] flex flex-col shadow-big ${className}`}>
      <div className="flex-1 rounded-[14px] mb-3.5 bg-stripes bg-white/40" />
      <div className="font-display font-bold text-2xl tracking-tight leading-none">{en}</div>
      <div className="text-ink-300 text-[13px] mt-1">{it}</div>
    </div>
  );
}

export default function EmptyStateView({ onCreate }: EmptyStateViewProps) {
  return (
    <div className="max-w-[1180px] mx-auto px-7 pt-9 pb-20 w-full">
      <div className="mt-[6vh] grid grid-cols-1 md:grid-cols-[1.05fr_.95fr] gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-600 text-xs font-semibold mb-[18px] tracking-wide">
            <Icon name="sparkles" size={13} />
            LEARN ENGLISH, ONE CARD AT A TIME
          </div>
          <h1
            className="font-display font-bold leading-[.98] tracking-tighter mb-[18px]"
            style={{ fontSize: 'clamp(40px, 5.4vw, 64px)' }}
          >
            Build your first<br />
            <em className="not-italic text-accent">vocabulary deck</em>.
          </h1>
          <p className="text-[17px] text-ink-500 max-w-[46ch] leading-relaxed mb-7">
            Group words into decks, attach a picture, a translation, and a sample sentence.
            Then flip through them, rate yourself with a thumbs up or down — and watch your
            weakest cards rise to the top.
          </p>
          <div className="flex gap-2.5 items-center">
            <button
              onClick={onCreate}
              className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-accent text-white shadow-accent hover:bg-accent-600"
            >
              <Icon name="plus" size={16} /> Create your first deck
            </button>
            <span className="text-ink-300 text-[13px] ml-1.5">
              Press{' '}
              <span className="font-mono text-[11px] px-1.5 py-[3px] border border-ink-700/20 rounded-md bg-white text-ink-500">
                N
              </span>{' '}
              anytime
            </span>
          </div>
        </div>
        <div className="relative h-[420px] [perspective:1200px]" aria-hidden="true">
          <HeroCard className="hero-c1 bg-peach" en="apple" it="mela" />
          <HeroCard className="hero-c2 bg-white z-[2]" en="house" it="casa" />
          <HeroCard className="hero-c3 bg-lav" en="cloud" it="nuvola" />
        </div>
      </div>
    </div>
  );
}
