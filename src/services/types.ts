export type Answer = {
  start_raw_date: string;
  report_title: string;
  start_time: string;
  end_time: string;
};
export type CreateReportResponse = {
  report_path: string;
  report_name: string;
};

export type WriteReportArgs = {
  path: string;
  content: string;
};
