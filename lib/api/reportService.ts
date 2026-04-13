import apiClient from "@/lib/api/client";

export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";
export type ReportTargetType = "video" | "user";

export type AdminReport = {
  id: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  actionTaken?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  targetType: ReportTargetType;
  reportedBy: {
    id: string;
    username: string;
    fullName?: string | null;
    profilePhotoUrl?: string | null;
  };
  subject:
      | {
        type: "video";
        video?: {
          id?: string;
          title?: string | null;
          thumbnailUrl?: string | null;
          isPublic?: boolean;
        } | null;
        owner?: {
          id: string;
          username: string;
          fullName?: string | null;
          profilePhotoUrl?: string | null;
        } | null;
      }
    | {
        type: "user";
        user?: {
          id: string;
          username: string;
          fullName?: string | null;
          profilePhotoUrl?: string | null;
          deactivatedAt?: string | null;
        } | null;
      };
};

type ListReportsResponse = {
  success: boolean;
  reports: AdminReport[];
};

type UpdateReportResponse = {
  success: boolean;
  report: AdminReport;
};

export const ReportAPI = {
  async getReports(params?: {
    status?: ReportStatus | "all";
    targetType?: ReportTargetType | "all";
    limit?: number;
  }): Promise<AdminReport[]> {
    const response = await apiClient.get<ListReportsResponse>("/admin/reports", {
      params,
    });
    return response.data.reports ?? [];
  },

  async updateReport(
    id: string,
    payload: {
      status: ReportStatus;
      actionTaken?: string;
      actionKind?: "hide_video" | "suspend_user" | "restore_video" | "restore_user";
    }
  ): Promise<AdminReport | null> {
    const response = await apiClient.patch<UpdateReportResponse>(
      `/admin/reports/${id}`,
      payload
    );
    return response.data.report ?? null;
  },
};
