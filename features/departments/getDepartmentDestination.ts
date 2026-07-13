import { departmentRouteMap } from './routeMap'

export function getDepartmentDestination(slug: string){
  return departmentRouteMap[slug as keyof typeof departmentRouteMap] ?? `/staff/departments/${slug}`
}

export function getDepartmentSlugForPath(pathname: string){
  const match = Object.entries(departmentRouteMap).find(([, path]) => pathname === path || pathname.startsWith(`${path}/`))
  return match?.[0] ?? null
}
