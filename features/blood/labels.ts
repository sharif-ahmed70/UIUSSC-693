export function formatBloodRequestStatus(status: string){
  const labels: Record<string, string> = {
    submitted: 'Pending Review',
    under_review: 'Reviewing',
    approved: 'Verified',
    matching: 'Searching Donor',
    partially_fulfilled: 'Donation Process',
    fulfilled: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    expired: 'Expired',
    archived: 'Archived',
  }

  return labels[status] ?? titleCase(status)
}

export function formatBloodMatchStatus(status: string){
  const labels: Record<string, string> = {
    suggested: 'Potential Donor Found',
    shortlisted: 'Shortlisted',
    approved_for_contact: 'Contact Approved',
    contacted: 'Contact Attempted',
    interested: 'Responded',
    declined: 'Unavailable',
    unavailable: 'Unavailable',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return labels[status] ?? titleCase(status)
}

export function formatBloodDonationStatus(status: string){
  const labels: Record<string, string> = {
    reported: 'Completed',
    under_review: 'Verification Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  return labels[status] ?? titleCase(status)
}

export function formatBloodPriority(priority: string | null | undefined){
  return titleCase(priority || 'normal')
}

export function formatBloodAvailability(status: string){
  const labels: Record<string, string> = {
    unknown: 'Unknown',
    available: 'Available',
    temporarily_unavailable: 'Temporarily Unavailable',
    unavailable: 'Unavailable',
    do_not_contact: 'Do Not Contact',
  }

  return labels[status] ?? titleCase(status)
}

export function priorityBadgeClass(priority: string | null | undefined){
  if (priority === 'critical') return 'bg-red-100 text-red-800 ring-red-200'
  if (priority === 'urgent') return 'bg-amber-100 text-amber-800 ring-amber-200'
  return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
}

function titleCase(value: string){
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
