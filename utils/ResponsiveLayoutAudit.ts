export interface ResponsiveLayoutIssue {
    type:
      | 'HORIZONTAL_OVERFLOW'
      | 'ELEMENT_OUTSIDE_VIEWPORT';
  
    message:
      string;
  
    selector?:
      string;
  
    elementText?:
      string;
  
    left?:
      number;
  
    right?:
      number;
  
    viewportWidth:
      number;
  }
  
  export interface ResponsiveLayoutAuditResult {
    viewport:
      string;
  
    width:
      number;
  
    height:
      number;
  
    documentWidth:
      number;
  
    horizontalOverflow:
      number;
  
    issues:
      ResponsiveLayoutIssue[];
  }
  