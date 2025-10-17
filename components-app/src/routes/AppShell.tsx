import { Outlet } from "react-router-dom";

const AppShell = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50">
      <Outlet />
    </div>
  );
};

export default AppShell;
