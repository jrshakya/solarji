import Sidebar from './Sidebar';
export default function Layout({ children, module }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f6f8' }}>
      <Sidebar module={module} />
      <main style={{ flex:1, overflowY:'auto', minWidth:0 }}>{children}</main>
    </div>
  );
}
