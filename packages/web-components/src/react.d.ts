/**
 * React JSX declarations for the custom elements. Opt in with a triple-slash
 * reference or a `tsconfig` `types` entry:
 *
 *   /// <reference types="@one-step-at-a-time/web-components/react" />
 */
import type {
  ArticulationType,
  Chord,
  ClefType,
  ConnectorRole,
  DurationType,
  DynamicMarking,
  GraceArticulationsType,
  GraceDuration,
  GraceNotesType,
  GraceOctavesType,
  GraceSlur,
  GraceType,
  GuitarFret,
  HairpinRole,
  Mode,
  Note,
  Octave,
  StaffGroupType,
  StressType,
  TimeSignature,
  TupletRatio,
  Voice,
} from '@one-step-at-a-time/web-components';
import 'react';

type WebComponentNoChildrenProps = {
  key?: React.Key;
  ref?: React.Ref<HTMLElement>;
  id?: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
};

type WebComponentProps = WebComponentNoChildrenProps & {
  children?: React.ReactNode;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'music-composition': WebComponentProps & {
        keySig?: Note;
        mode?: Mode;
        time?: TimeSignature;
      };
      'music-measure': WebComponentProps & {
        number?: number;
        keySig?: Note;
        mode?: Mode;
        time?: TimeSignature;
      };
      'music-staff': WebComponentProps & {
        clef?: ClefType;
        keySig?: Note;
        mode?: Mode;
        time?: TimeSignature;
        editable?: boolean;
        managed?: boolean;
        // Pairs this staff with its immediate next sibling under a
        // brace ("grand") or bracket connector — see StaffElementBase#group.
        group?: StaffGroupType;
        // Shared identifier joining this staff with other group="bracket"
        // staves into one multi-staff bracket connector — see StaffElementBase#groupId.
        'group-id'?: string;
      };
      'music-staff-guitar-tab': WebComponentProps & {
        time?: TimeSignature;
        group?: StaffGroupType;
        'group-id'?: string;
      };
      'music-staff-vocal': WebComponentProps & {
        voice?: Voice;
        keySig?: Note;
        mode?: Mode;
        time?: TimeSignature;
        editable?: boolean;
        managed?: boolean;
        group?: StaffGroupType;
        'group-id'?: string;
      };
      'music-lyrics': WebComponentProps & {
        verse?: string;
      };
      'music-clef': WebComponentNoChildrenProps & {
        clef?: ClefType;
      };
      'music-rest': WebComponentNoChildrenProps & {
        duration?: DurationType;
        onPointerDown?: (e: PointerEvent) => void;
        onPointerUp?: (e: PointerEvent) => void;
      };
      'music-tuplet': WebComponentProps & {
        ratio?: TupletRatio;
      };
      'music-chord': WebComponentProps & {
        chord?: Chord;
        duration?: DurationType;
        tie?: ConnectorRole;
        slur?: ConnectorRole;
        // Binds this element (as a connector end) to the start element whose
        // `id` matches — needed only when interleaving same-kind ties/slurs
        // would otherwise mis-pair on the renderer's LIFO stack.
        for?: string;
        dynamic?: DynamicMarking;
        crescendo?: HairpinRole;
        decrescendo?: HairpinRole;
        diminuendo?: HairpinRole;
        articulation?: ArticulationType;
        stress?: StressType;
        // Grace-note letters preceding this element. A comma-separated string
        // ("F#,G") or the `Note[]` array — the setter accepts both.
        grace?: GraceNotesType;
        // Grace-note octaves aligned by index with `grace`. A comma-separated
        // string ("4,,5", empty slot = use the host element's own octave) or
        // the `(Octave | null)[]` array.
        'grace-octave'?: GraceOctavesType;
        // Per-grace-note articulation aligned by index with `grace`. A
        // comma-separated string ("staccato,,accent", empty slot = no mark) or
        // the `(ArticulationType | null)[]` array.
        'grace-articulation'?: GraceArticulationsType;
        'grace-type'?: GraceType;
        'grace-duration'?: GraceDuration;
        'grace-slur'?: GraceSlur;
        // A single dynamic for the whole grace group, independent of `dynamic`.
        'grace-dynamic'?: DynamicMarking;
        onPointerDown?: (e: PointerEvent) => void;
        onPointerUp?: (e: PointerEvent) => void;
      };
      'music-note': WebComponentNoChildrenProps & {
        note?: Note;
        duration?: DurationType;
        octave?: Octave;
        tie?: ConnectorRole;
        slur?: ConnectorRole;
        // Binds this element (as a connector end) to the start element whose
        // `id` matches — needed only when interleaving same-kind ties/slurs
        // would otherwise mis-pair on the renderer's LIFO stack.
        for?: string;
        dynamic?: DynamicMarking;
        crescendo?: HairpinRole;
        decrescendo?: HairpinRole;
        diminuendo?: HairpinRole;
        articulation?: ArticulationType;
        stress?: StressType;
        // Grace-note letters preceding this element. A comma-separated string
        // ("F#,G") or the `Note[]` array — the setter accepts both.
        grace?: GraceNotesType;
        // Grace-note octaves aligned by index with `grace`. A comma-separated
        // string ("4,,5", empty slot = use the host element's own octave) or
        // the `(Octave | null)[]` array.
        'grace-octave'?: GraceOctavesType;
        // Per-grace-note articulation aligned by index with `grace`. A
        // comma-separated string ("staccato,,accent", empty slot = no mark) or
        // the `(ArticulationType | null)[]` array.
        'grace-articulation'?: GraceArticulationsType;
        'grace-type'?: GraceType;
        'grace-duration'?: GraceDuration;
        'grace-slur'?: GraceSlur;
        // A single dynamic for the whole grace group, independent of `dynamic`.
        'grace-dynamic'?: DynamicMarking;
        onPointerDown?: (e: PointerEvent) => void;
        onPointerUp?: (e: PointerEvent) => void;
        // Custom events (note-click, note-pointerdown, note-pointerup) require
        // useRef + addEventListener in React — they are not auto-wired by prop name.
      };
      'music-guitar-note': WebComponentNoChildrenProps & {
        fret?: GuitarFret;
        string?: number;
        duration?: DurationType;
        tie?: ConnectorRole;
        slur?: ConnectorRole;
        'hammer-on'?: ConnectorRole;
        'pull-off'?: ConnectorRole;
        slide?: ConnectorRole;
      };
    }
  }
}
