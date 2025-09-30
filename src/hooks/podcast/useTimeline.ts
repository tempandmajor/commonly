import { useCallback, useMemo, useReducer } from 'react';
import { TimelineState, TimelineTrack, TimelineClip } from '@/lib/types/podcast-editor';

type Action =
  | { type: 'init'; payload: Partial<TimelineState> }
  | { type: 'set_playhead'; payload: number }
  | { type: 'zoom'; payload: number }
  | { type: 'add_track'; payload: TimelineTrack }
  | { type: 'add_clip'; payload: TimelineClip }
  | { type: 'move_clip'; payload: { id: string; start: number; end?: number } }
  | { type: 'select_clips'; payload: string[] }
  | { type: 'trim_clip'; payload: { id: string; inPoint?: number; outPoint?: number } }
  | { type: 'split_clip'; payload: { id: string; at: number } }
  | { type: 'resize_clip'; payload: { id: string; edge: 'start' | 'end'; time: number } }
  | { type: 'update_clip'; payload: { id: string; patch: Partial<TimelineClip> } };

const initialState: TimelineState = {
  id: 'timeline',
  fps: 30,
  duration: 0,
  zoom: 0.5,
  playhead: 0,
  tracks: {},
  clips: {},
  selection: { clipIds: [] },
};

function reducer(state: TimelineState, action: Action): TimelineState {
  const computeDuration = (clips: Record<string, TimelineClip>) => {
    let maxEnd = 0;
    for (const id in clips) {
      const c = clips[id];
      if (c?.end && c.end > maxEnd) maxEnd = c.end;
    }
    return maxEnd;
  };
  switch (action.type) {
    case 'init':
      return { ...state, ...action.payload } as TimelineState;
    case 'set_playhead':
      return { ...state, playhead: Math.max(0, action.payload) };
    case 'zoom':
      return { ...state, zoom: Math.min(1, Math.max(0, action.payload)) };
    case 'add_track': {
      const track = action.payload;
      return {
          ...state,
        tracks: { ...state.tracks, [track.id]: track },
      };
    }
    case 'add_clip': {
      const clip = action.payload;
      const track = state.tracks[clip.trackId];
      if (!track) return state;
      const nextClips = { ...state.clips, [clip.id]: clip };
      return {
          ...state,
        clips: nextClips,
        tracks: {
          ...state.tracks,
          [clip.trackId]: { ...track, clips: [...track.clips, clip.id] },
        },
        duration: Math.max(state.duration, clip.end || state.duration),
      };
    }
    case 'move_clip': {
      const { id, start, end } = action.payload;
      const clip = state.clips[id];
      if (!clip) return state;
      const updated: TimelineClip = {
          ...clip,
        start: Math.max(0, start),
        end: end !== undefined ? Math.max(start, end) : clip.end,
      };
      const nextClips = { ...state.clips, [id]: updated };
      return { ...state, clips: nextClips, duration: computeDuration(nextClips) };
    }
    case 'select_clips':
      return { ...state, selection: { clipIds: action.payload } };
    case 'trim_clip': {
      const { id, inPoint, outPoint } = action.payload;
      const clip = state.clips[id];
      if (!clip) return state;
      const updated: TimelineClip = {
          ...clip,
        inPoint: inPoint ?? clip.inPoint,
        outPoint: outPoint ?? clip.outPoint,
      };
      const nextClips = { ...state.clips, [id]: updated };
      return { ...state, clips: nextClips, duration: computeDuration(nextClips) };
    }
    case 'split_clip': {
      const { id, at } = action.payload;
      const clip = state.clips[id];
      if (!clip) return state;
      const splitAt = Math.min(Math.max(at, clip.start), clip.end);
      if (splitAt <= clip.start || splitAt >= clip.end) return state;
      const left: TimelineClip = { ...clip, end: splitAt };
      const rightId = `${id}_split_${Math.floor(splitAt * 1000)}`;
      const right: TimelineClip = { ...clip, id: rightId, start: splitAt };
      const nextClips = { ...state.clips, [id]: left, [rightId]: right };
      const track = state.tracks[clip.trackId];
      const nextTrack: TimelineTrack = {
          ...track,
        clips: track.clips.flatMap(cid => (cid === id ? [id, rightId] : [cid])),
      };
      return {
          ...state,
        clips: nextClips,
        tracks: { ...state.tracks, [clip.trackId]: nextTrack },
        duration: computeDuration(nextClips),
      };
    }
    case 'resize_clip': {
      const { id, edge, time } = action.payload;
      const clip = state.clips[id];
      if (!clip) return state;
      let start = clip.start;
      let end = clip.end;
      if (edge === 'start') start = Math.min(Math.max(0, time), clip.end - 0.05);
      else end = Math.max(time, clip.start + 0.05);
      const updated: TimelineClip = { ...clip, start, end };
      const nextClips = { ...state.clips, [id]: updated };
      return { ...state, clips: nextClips, duration: computeDuration(nextClips) };
    }
    case 'update_clip': {
      const { id, patch } = action.payload;
      const clip = state.clips[id];
      if (!clip) return state;
      const updated: TimelineClip = { ...clip, ...patch };
      const nextClips = { ...state.clips, [id]: updated };
      return { ...state, clips: nextClips };
    }
    default:
      return state;
  }
}

export function useTimeline(initial?: Partial<TimelineState>) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...initial });

  const actions = useMemo(
    () => ({
      init: (payload: Partial<TimelineState>) => dispatch({ type: 'init', payload }),
      setPlayhead: (t: number) => dispatch({ type: 'set_playhead', payload: t }),
      setZoom: (z: number) => dispatch({ type: 'zoom', payload: z }),
      addTrack: (track: TimelineTrack) => dispatch({ type: 'add_track', payload: track }),
      addClip: (clip: TimelineClip) => dispatch({ type: 'add_clip', payload: clip }),
      moveClip: (id: string, start: number, end?: number) =>
        dispatch({ type: 'move_clip', payload: { id, start, end } }),
      selectClips: (ids: string[]) => dispatch({ type: 'select_clips', payload: ids }),
      trimClip: (id: string, inPoint?: number, outPoint?: number) =>
        dispatch({ type: 'trim_clip', payload: { id, inPoint, outPoint } }),
      splitClip: (id: string, at: number) => dispatch({ type: 'split_clip', payload: { id, at } }),
      resizeClip: (id: string, edge: 'start' | 'end', time: number) =>
        dispatch({ type: 'resize_clip', payload: { id, edge, time } }),
      updateClip: (id: string, patch: Partial<TimelineClip>) =>
        dispatch({ type: 'update_clip', payload: { id, patch } }),
    }),
    []
  );

  const getSelectedClips = useCallback(
    () => state.selection.clipIds.map(id => state.clips[id]).filter(Boolean),
    [state]
  );

  return { state, ...actions, getSelectedClips };
}
