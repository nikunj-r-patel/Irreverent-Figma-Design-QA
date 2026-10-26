export interface ResponsiveContentClippingIssue {
    type:
      | 'TEXT_CLIPPED'
      | 'CONTENT_CLIPPED';
  
    selector:
      string;
  
    text?:
      string;
  
    clientWidth:
      number;
  
    scrollWidth:
      number;
  
    clientHeight:
      number;
  
    scrollHeight:
      number;
  
    overflowX:
      string;
  
    overflowY:
      string;
  
    clippingAncestorSelector?:
      string;
  
    clippingAxis?:
      | 'X'
      | 'Y'
      | 'BOTH';
  }
  
  export interface ResponsiveContentClippingAuditResult {
    viewport:
      string;
  
    width:
      number;
  
    height:
      number;
  
    issues:
      ResponsiveContentClippingIssue[];
  }