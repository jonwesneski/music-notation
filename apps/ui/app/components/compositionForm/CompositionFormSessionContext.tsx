import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { removeSelectionFromStructure } from './deleteSelection';
import { computeBoxSelection } from './selectionHitTest';
import type {
  CompositionStructure,
  DraftMusicEntry,
  Selection,
  StaffType,
} from './types';
import { EMPTY_SELECTION, isSelectionEmpty } from './types';

export type CompositionFormSession = {
  lastActiveEntry: 'note' | 'chord' | 'rest';
  entryPanelTab: string | null;
  selection: Selection;
};

type CompositionFormSessionContextValue = {
  session: CompositionFormSession;
  setSession: (patch: Partial<CompositionFormSession>) => void;
  registerMeasureRef: (id: string, el: HTMLElement | null) => void;
  registerStaffRef: (id: string, el: HTMLElement | null) => void;
  registerEntryRef: (id: string, el: HTMLElement | null) => void;
  selectMeasure: (measureId: string) => void;
  selectStaff: (
    measureId: string,
    staffId: string,
    e: React.MouseEvent
  ) => void;
  selectEntry: (
    measureId: string,
    staffId: string,
    entryId: string,
    e: React.MouseEvent
  ) => void;
  applyDragSelection: (
    dragRect: DOMRect,
    structure: Pick<
      CompositionStructure,
      'measureOrder' | 'measuresById' | 'stavesById'
    >
  ) => void;
  deleteSelected: () => void;
  addMeasure: () => void;
  addStaff: (measureId: string, staffType: StaffType) => void;
  addEntry: (
    measureId: string,
    staffId: string,
    entry: DraftMusicEntry
  ) => void;
};

const CompositionFormSessionContext =
  createContext<CompositionFormSessionContextValue | null>(null);

type CompositionFormSessionProviderProps = {
  getStructure: () => CompositionStructure;
  recordStructure: (structure: CompositionStructure) => void;
  onAddMeasure: () => void;
  onAddStaff: (measureId: string, staffType: StaffType) => void;
  onAddEntry: (
    measureId: string,
    staffId: string,
    entry: DraftMusicEntry
  ) => void;
  children: React.ReactNode;
};

// For state that is shared across the composition form, but NOT submitted
export function CompositionFormSessionProvider({
  getStructure,
  recordStructure,
  onAddMeasure,
  onAddStaff,
  onAddEntry,
  children,
}: CompositionFormSessionProviderProps) {
  const [session, setSessionState] = useState<CompositionFormSession>({
    lastActiveEntry: 'note',
    entryPanelTab: null,
    selection: EMPTY_SELECTION,
  });
  const setSession = useCallback(
    (patch: Partial<CompositionFormSession>) =>
      setSessionState((prev) => ({ ...prev, ...patch })),
    []
  );

  const measureRefs = useRef(new Map<string, HTMLElement>());
  const staffRefs = useRef(new Map<string, HTMLElement>());
  const entryRefs = useRef(new Map<string, HTMLElement>());

  const registerMeasureRef = useCallback(
    (id: string, el: HTMLElement | null) => {
      if (el) measureRefs.current.set(id, el);
      else measureRefs.current.delete(id);
    },
    []
  );
  const registerStaffRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) staffRefs.current.set(id, el);
    else staffRefs.current.delete(id);
  }, []);
  const registerEntryRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) entryRefs.current.set(id, el);
    else entryRefs.current.delete(id);
  }, []);

  const selectMeasure = useCallback(
    (measureId: string) => {
      setSession({
        selection: { measureIds: [measureId], staffIds: [], entryIds: [] },
      });
    },
    [setSession]
  );

  const selectStaff = useCallback(
    (measureId: string, staffId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSession({
        selection: { measureIds: [], staffIds: [staffId], entryIds: [] },
      });
    },
    [setSession]
  );

  const selectEntry = useCallback(
    (
      measureId: string,
      staffId: string,
      entryId: string,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();
      setSession({
        selection: { measureIds: [], staffIds: [], entryIds: [entryId] },
      });
    },
    [setSession]
  );

  const applyDragSelection = useCallback(
    (
      dragRect: DOMRect,
      structure: Pick<
        CompositionStructure,
        'measureOrder' | 'measuresById' | 'stavesById'
      >
    ) => {
      const selection = computeBoxSelection(dragRect, structure, {
        measures: measureRefs.current,
        staves: staffRefs.current,
        entries: entryRefs.current,
      });
      setSession({ selection });
    },
    [setSession]
  );

  const deleteSelected = useCallback(() => {
    if (isSelectionEmpty(session.selection)) return;
    recordStructure(
      removeSelectionFromStructure(getStructure(), session.selection)
    );
    setSession({ selection: EMPTY_SELECTION });
  }, [session.selection, getStructure, recordStructure, setSession]);

  return (
    <CompositionFormSessionContext
      value={{
        session,
        setSession,
        registerMeasureRef,
        registerStaffRef,
        registerEntryRef,
        selectMeasure,
        selectStaff,
        selectEntry,
        applyDragSelection,
        deleteSelected,
        addMeasure: onAddMeasure,
        addStaff: onAddStaff,
        addEntry: onAddEntry,
      }}
    >
      {children}
    </CompositionFormSessionContext>
  );
}

export function useCompositionFormSession() {
  const ctx = useContext(CompositionFormSessionContext);
  if (!ctx)
    throw new Error(
      `${useCompositionFormSession.name} must be used within ${CompositionFormSessionProvider.name}`
    );
  return ctx;
}
