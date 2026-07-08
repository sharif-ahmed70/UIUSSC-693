import PublicBloodDonorForm from '@/components/blood/PublicBloodDonorForm'

export default function BloodDonorRegistrationPage(){
  return (
    <main className="bg-uiussc-ivory py-12">
      <div className="container max-w-4xl">
        <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-uiussc-green">UIUSSC Blood Support</p>
        <h1 className="mt-3 text-4xl font-extrabold text-uiussc-navy">Register as a potential donor</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">
          Share your availability for human-reviewed donor coordination. UIUSSC does not publish private contact details.
        </p>
        <div className="mt-8">
          <PublicBloodDonorForm />
        </div>
      </div>
    </main>
  )
}
