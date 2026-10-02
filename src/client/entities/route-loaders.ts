type SatisRouteModule = typeof import('app/entities/satis/satis');

let satisRoutePromise: Promise<SatisRouteModule> | undefined;

export const loadSatisRoute = () => {
  if (!satisRoutePromise) {
    satisRoutePromise = import('app/entities/satis/satis').catch(error => {
      satisRoutePromise = undefined;
      throw error;
    });
  }

  return satisRoutePromise;
};

export const preloadSatisRoute = () => {
  const routePromise = loadSatisRoute();
  void routePromise.catch(() => undefined);
  return routePromise;
};

export const preloadEntityRouteForPath = (pathname: string) => {
  if (/^\/satis(?:\/|$)/.test(pathname)) {
    return preloadSatisRoute();
  }

  return undefined;
};
