import React from 'react';
import { VersionCheckState } from '../hooks/useVersionCheck';

interface VersionUpdateBannerProps {
  versionState?: VersionCheckState;
}

/**
 * VersionUpdateBanner is suppressed to ensure silent background cache updates
 * without disruptive popup messages or page reloads.
 */
export const VersionUpdateBanner: React.FC<VersionUpdateBannerProps> = () => {
  return null;
};

