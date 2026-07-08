import { browser } from '$app/environment';

type NavigatorWithUaData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
  standalone?: boolean;
};

const MOBILE_DEVICE_RE = /Android.+Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i;
const TABLET_DEVICE_RE = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i;
const IPAD_MAX_WIDTH = 1024;

export function isInstalledPwa() {
  if (!browser) return false;

  const navigatorWithUaData = navigator as NavigatorWithUaData;

  return (
    navigatorWithUaData.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  );
}

export function isMobileOrTabletDevice() {
  if (!browser) return false;

  const navigatorWithUaData = navigator as NavigatorWithUaData;
  const userAgent = navigator.userAgent;
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isTablet = TABLET_DEVICE_RE.test(userAgent) || isTouchMac;
  const isMobile =
    navigatorWithUaData.userAgentData?.mobile === true || MOBILE_DEVICE_RE.test(userAgent);

  return isMobile || isTablet;
}

export function isIpadOrSmallerViewport() {
  if (!browser) return false;

  return Math.min(window.innerWidth, window.innerHeight) <= IPAD_MAX_WIDTH;
}
