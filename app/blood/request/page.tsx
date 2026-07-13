import PublicBloodRequestForm from '@/components/blood/PublicBloodRequestForm'

export default function BloodRequestPage(){
  return (
    <main className="bg-uiussc-ivory py-12">
      <div className="container max-w-4xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-uiussc-green">UIUSSC Blood Support</p>
        <h1 className="mt-3 text-4xl font-extrabold text-uiussc-navy">Request blood support</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Submit a request for Blood Department review. This is not an emergency medical service; contact hospital and emergency channels first for urgent care.
        </p>
        <div className="mt-8">
          <PublicBloodRequestForm />
        </div>
      </div>
    </main>
  )
}
