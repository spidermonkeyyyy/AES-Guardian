export type VideoReviewStatusValue = 'pendingReview' | 'reviewed' | 'retryRequested';

export const VIDEO_REVIEW_STATUSES: VideoReviewStatusValue[] = ['pendingReview', 'reviewed', 'retryRequested'];

export interface InhalerVideo {
  id: string;
  patientId: string;
  fileUri: string;
  uploadedAt: string; // ISO timestamp preserved from source
  reviewStatus: VideoReviewStatusValue;
  reviewedAt?: string;
  reviewerNote?: string;
}

export interface VideoUploadContract {
  uploadVideo(params: { filePath: string; patientId: string; recordingDurationMs: number }): Promise<InhalerVideo>;
  getLatestSubmission(patientId: string): Promise<InhalerVideo | null>;
}
