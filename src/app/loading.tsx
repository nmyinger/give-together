import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Featured auction hero skeleton */}
      <section className="relative rounded-2xl overflow-hidden border border-white/10">
        <Skeleton className="w-full aspect-[21/9] min-h-[280px]" />
      </section>

      {/* Auction grid skeleton */}
      <section className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <Skeleton className="w-full aspect-[16/9]" />
              <div className="p-4 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-24" />
                  </div>
                  <div className="space-y-1 items-end flex flex-col">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <div className="pt-1 border-t border-white/10">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
