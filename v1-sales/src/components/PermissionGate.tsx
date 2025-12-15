import { ReactNode } from 'react';

interface PermissionGateProps {
  required: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGate = ({ children }: PermissionGateProps) => {
  return <>{children}</>;
};