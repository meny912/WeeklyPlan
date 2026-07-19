export interface TanyaEntry {
  /** Hebrew date string from the מניין (standard) edition, e.g. "יט כסלו" */
  date: string;
  /** Raw day number parsed from the date marker */
  day: string;
  /** Month name in Hebrew */
  month: string;
  /** The Hebrew text content for this date (exactly as-is, no modifications) */
  content: string;
}
