import { VideoUploadContract, InhalerVideo, VideoReviewStatusValue } from '../types/inhaler_video';

export class MockVideoUploadRepository implements VideoUploadContract {
  private _latest?: InhalerVideo;

  async uploadVideo(params: { filePath: string; patientId: string; recordingDurationMs: number }): Promise<InhalerVideo> {
    const simulatedMs = Math.max(1000, Math.min(3000, params.recordingDurationMs * 80));
    await new Promise(r => setTimeout(r, simulatedMs));
    if (params.filePath.includes('error')) {
      throw new Error('Simulated upload failure');
    }
    const video: InhalerVideo = {
      id: `video-${Date.now()}`,
      patientId: params.patientId,
      fileUri: params.filePath,
      uploadedAt: new Date().toISOString(),
      reviewStatus: 'pendingReview',
      reviewedAt: undefined,
      reviewerNote: undefined,
    };
    this._latest = video;
    return video;
  }

  async getLatestSubmission(patientId: string): Promise<InhalerVideo | null> {
    return this._latest?.patientId === patientId ? this._latest : null;
  }
}
