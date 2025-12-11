export default function Footer() {
  return (
    <footer className="w-full bg-[#001e50] px-1 fixed bottom-0 left-0 z-50" style={{ boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between min-h-0 h-[35px]">
        <div className="text-white text-sm font-medium flex items-center gap-2">
          © 2025 FrancautoLabs - Desenvolvido com <span className="text-red-500 mx-1">♥</span> - Todos os direitos reservados.
        </div>
        <div className="flex items-center">
          <img
            src="/logoFrancautoLabs.png"
            alt="Logo FrancautoLabs"
            className="h-5"
            style={{ filter: 'invert(1) brightness(100)' }}
          />
        </div>
      </div>
    </footer>
  );
}