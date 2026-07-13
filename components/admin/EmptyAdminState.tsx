export default function EmptyAdminState({ message = 'No records found.' }: { message?: string }){
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
      {message}
    </div>
  )
}
