export default function Pagination() {
  return (
    <div className="flex justify-center items-center gap-2 py-8">
      <button className="h-10 w-10 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-primary hover:text-white transition-all">
        <span className="material-symbols-outlined">chevron_left</span>
      </button>
      <button className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary text-white font-bold">1</button>
      <button className="h-10 w-10 rounded-lg flex items-center justify-center border border-slate-200 font-bold hover:bg-slate-100 transition-all">2</button>
      <button className="h-10 w-10 rounded-lg flex items-center justify-center border border-slate-200 font-bold hover:bg-slate-100 transition-all">3</button>
      <span className="px-2">...</span>
      <button className="h-10 w-10 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:bg-primary hover:text-white transition-all">
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  )
}
