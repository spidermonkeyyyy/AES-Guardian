const DashboardHeader = () => {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  return (
    <header style={{
      background: colors.background,
      padding: '12px 20px',
      borderBottom: '1px solid colors.border',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ margin: 0, fontSize: '1.25rem', color: colors.foreground }}>
        Accueil — {today}
      </h1>
    </header>
  );
};
export default DashboardHeader;