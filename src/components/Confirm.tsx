type ConfirmProps = {
  title: string
  message: string
  confirmText?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function Confirm({ title, message, confirmText = 'Confirm', danger, onConfirm, onClose }: ConfirmProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-ink-700/35 backdrop-blur-[4px] z-[100] grid place-items-center p-6 animate-fadeIn"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[28px] w-full max-w-[440px] shadow-big animate-pop"
      >
        <div className="px-6 pt-[22px]">
          <h3 className="font-display font-bold text-[22px] tracking-tight m-0">{title}</h3>
          <p className="mt-1.5 text-[13px] text-ink-300">{message}</p>
        </div>
        <div className="px-6 pt-3.5 pb-[22px] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm bg-transparent text-ink-700 border border-ink-700/20 hover:bg-ink-700/5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 active:translate-y-px cursor-pointer px-[18px] py-[11px] rounded-xl text-sm text-white ${
              danger
                ? 'bg-bad shadow-[0_8px_20px_-8px_rgba(217,119,102,.5)] hover:bg-bad-700'
                : 'bg-ink-700 shadow-ink hover:bg-[#1c130b]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
