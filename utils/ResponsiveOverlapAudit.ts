export interface ResponsiveOverlapIssue {
    type:
      | 'UNEXPECTED_OVERLAP';
  
    firstSelector:
      string;
  
    secondSelector:
      string;
  
    firstText?:
      string;
  
    secondText?:
      string;
  
    overlapWidth:
      number;
  
    overlapHeight:
      number;
  
    overlapArea:
      number;
  }
  
  export interface ResponsiveOverlapAuditResult {
    viewport:
      string;
  
    width:
      number;
  
    height:
      number;
  
    issues:
      ResponsiveOverlapIssue[];
  }
  