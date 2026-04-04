export interface SOPSectionContent {
  id: string;
  title: string;
  content: string;
}

export interface SOPFullContent {
  sopNumber: string;
  title: string;
  sections: SOPSectionContent[];
}
