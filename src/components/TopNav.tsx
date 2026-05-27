import { Link, useLocation } from 'react-router-dom';

export function TopNav() {
  const { pathname } = useLocation();
  const linkCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <nav className="absolute top-4 right-4 z-20 flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      <Link to="/" className={linkCls(pathname === '/')}>Packages</Link>
      <Link to="/person" className={linkCls(pathname === '/person')}>People</Link>
      <Link to="/conferences" className={linkCls(pathname === '/conferences')}>Conferences</Link>
    </nav>
  );
}
