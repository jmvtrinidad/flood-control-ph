import type { Project } from '@/types/project';

export function downloadCSV(projects: Project[], filename = 'projects.csv') {
  const headers = [
    'ID', 'Project Name', 'Location', 'Latitude', 'Longitude', 
    'Contractor', 'Cost', 'Start Date', 'Completion Date', 
    'Fiscal Year', 'Region', 'Status', 'Other Details'
  ];

  const csvRows = [
    headers.join(','),
    ...projects.map(p => [
      p.id,
      `"${p.projectname.replace(/"/g, '""')}"`,
      `"${p.location.replace(/"/g, '""')}"`,
      p.latitude,
      p.longitude,
      `"${p.contractor.replace(/"/g, '""')}"`,
      p.cost,
      p.start_date || '',
      p.completion_date || '',
      p.fy,
      `"${p.region.replace(/"/g, '""')}"`,
      p.status || '',
      p.other_details ? `"${p.other_details.replace(/"/g, '""')}"` : ''
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function downloadJSON(projects: Project[], filename = 'projects.json') {
  const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function exportToCSVFromAPI(filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
  }

  const url = `/api/projects/export/csv${params.toString() ? `?${params.toString()}` : ''}`;
  window.open(url, '_blank');
}
