export type PlatformAdminRole = 'super_admin' | 'operator' | 'readonly';

export type PlatformAdminJwtPayload = {
  sub: string;
  email: string;
  role: PlatformAdminRole;
  typ: 'platform_access';
};
