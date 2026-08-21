const segment = (value: string) => encodeURIComponent(value);

export const apiRoutes = {
  auth: {
    adminSession: "/admin/auth/sessions",
    requestOtp: "/auth/otp/request",
    verifyOtp: "/auth/otp/verify",
    session: "/auth/session",
    refreshSession: "/auth/sessions/refresh",
    currentSession: "/auth/sessions/current",
  },
  catalog: {
    appBootstrap: "/app-bootstrap",
    availability: "/availability",
    branches: "/branches",
    branch: (branchId: string) => `/branches/${segment(branchId)}`,
    branchCategories: (branchId: string) =>
      `/branches/${segment(branchId)}/service-categories`,
    branchServices: (branchId: string) =>
      `/branches/${segment(branchId)}/services`,
    branchService: (branchId: string, serviceId: string) =>
      `/branches/${segment(branchId)}/services/${segment(serviceId)}`,
    branchEligibleStaff: (branchId: string) =>
      `/branches/${segment(branchId)}/eligible-staff`,
    nailDesigns: "/nail-designs",
    nailDesign: (designId: string) => `/nail-designs/${segment(designId)}`,
    promotions: "/promotions",
    reviews: "/reviews",
  },
  customer: {
    home: "/customer-home",
    me: "/me",
    appointments: "/me/appointments",
    appointment: (appointmentId: string) =>
      `/me/appointments/${segment(appointmentId)}`,
    coupons: "/me/coupons",
    membershipCard: "/me/membership-card",
    membershipProgress: "/me/membership-progress",
    notifications: "/me/notifications",
    pointTransactions: "/me/point-transactions",
  },
  admin: {
    branches: "/admin/branches",
    branch: (branchId: string) => `/admin/branches/${segment(branchId)}`,
    branchDashboard: (branchId: string) =>
      `/admin/branches/${segment(branchId)}/dashboard`,
    branchAppointments: (branchId: string) =>
      `/admin/branches/${segment(branchId)}/appointments`,
    branchCustomers: (branchId: string) =>
      `/admin/branches/${segment(branchId)}/customers`,
    services: "/admin/services",
    service: (serviceId: string) => `/admin/services/${segment(serviceId)}`,
    serviceCategories: "/admin/service-categories",
    staff: "/admin/staff",
    staffMember: (staffId: string) => `/admin/staff/${segment(staffId)}`,
  },
} as const;
