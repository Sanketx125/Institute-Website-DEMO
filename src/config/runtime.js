const injected = globalThis.DEEKSHAAM_CONFIG || {};

export const runtime = {
  apiBaseUrl: String(injected.apiBaseUrl || '').replace(/\/$/, ''),
  endpoints: {
    applicationSubmit: injected.applicationSubmit || '/admissions/applications',
    applicationStatus: injected.applicationStatus || '/admissions/applications',
    enquiry: injected.enquiry || '/leads/enquiries',
    campusVisit: injected.campusVisit || '/leads/campus-visits'
  }
};

export function apiUrl(path){
  return runtime.apiBaseUrl ? `${runtime.apiBaseUrl}${path}` : '';
}
