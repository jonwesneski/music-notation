import { useCompositionFormSession } from './CompositionFormSessionContext';

interface AnchoredTabPanelTab {
  label: string;
  content: React.ReactNode;
}

interface AnchoredTabPanelProps {
  tabs: AnchoredTabPanelTab[];
}

export function AnchoredTabPanel({ tabs }: AnchoredTabPanelProps) {
  const { session, setSession } = useCompositionFormSession();

  const activeLabel = tabs.some((t) => t.label === session.entryPanelTab)
    ? session.entryPanelTab
    : tabs[0].label;
  const activeTab = tabs.find((t) => t.label === activeLabel) ?? tabs[0];

  return (
    <div
      className="fixed bottom-0 left-0 w-full h-[25vh] md:absolute md:bottom-auto md:top-full md:left-1/2 md:h-auto md:w-72 md:-translate-x-1/2 md:mt-1 z-20 shadow-lg bg-white flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex border-b border-zinc-200 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            className={`px-4 py-2 text-sm cursor-pointer bg-transparent border-0 ${
              t.label === activeTab.label
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
            onClick={() => setSession({ entryPanelTab: t.label })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">{activeTab.content}</div>
    </div>
  );
}
