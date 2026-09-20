import { create } from 'zustand';
import { MockVideoUploadRepository } from '../repositories/mock_video_upload_repository';
import { InhalerVideo, VideoReviewStatusValue } from '../types/inhaler_video';

export type SubmissionStatusValue = 'idle' | 'requestingPermission' | 'permissionDenied' | 'recording' | 'previewing' | 'uploading' | 'success' | 'error';

export interface VideoSubmissionState {
  status: SubmissionStatusValue;
  recordingDurationMs: number;
  recordingPath?: string;
  latestSubmission?: InhalerVideo;
  errorMessage?: string;
}

export interface VideoSubmissionActions {
  requestPermission: () => void;
  onPermissionResult: (granted: boolean) => void;
  updateRecordingDuration: (ms: number) => void;
  stopRecording: () => void;
  retake: () => void;
  submitVideo: (filePath: string, patientId: string) => Promise<void>;
  reset: () => void;
}

export const useVideoSubmissionStore = create<VideoSubmissionState & VideoSubmissionActions>((set, get) => {
  const repo = new MockVideoUploadRepository();
  return {
    status: 'idle',
    recordingDurationMs: 0,
    requestPermission: () => set({ status: 'requestingPermission' }),
    onPermissionResult: (granted) => set({
      status: granted ? 'recording' : 'permissionDenied',
      recordingDurationMs: granted ? 0 : get().recordingDurationMs,
    }),
    updateRecordingDuration: (ms) => set({ recordingDurationMs: ms }),
    stopRecording: () => set({
      status: 'previewing',
      recordingPath: `mock://recording-${Date.now()}.mp4`,
    }),
    retake: () => set({ status: 'recording', recordingDurationMs: 0, recordingPath: undefined, errorMessage: undefined }),
    submitVideo: async (filePath, patientId) => {
      const current = get();
      if (!current.recordingPath) return;
      set({ status: 'uploading', errorMessage: undefined });
      try {
        const video = await repo.uploadVideo({ filePath, patientId, recordingDurationMs: current.recordingDurationMs });
        set({ status: 'success', latestSubmission: video });
      } catch (e) {
        set({ status: 'error', errorMessage: "La vidéo n'a pas pu être envoyée. Veuillez réessayer." });
      }
    },
    reset: () => set({ status: 'idle', recordingDurationMs: 0, recordingPath: undefined, errorMessage: undefined, latestSubmission: undefined }),
  };
});
