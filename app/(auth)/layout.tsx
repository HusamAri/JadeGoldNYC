export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Dashboard kabuğuyla aynı ambiyans dili: arka planda çok yavaş süzülen
       holo blob'lar (z -10) + mat "pahalı doku" gren (z -9). `isolate`
       negatif z katmanlarını bu bağlamda hapseder; sağdaki cam form kartı
       bu ortamın ÜSTÜNDE yüzer — cam hiçbir zaman düz opak kutu değildir. */
    <div className="bg-background relative isolate min-h-svh">
      <div aria-hidden className="holo-drift" />
      <div aria-hidden className="lux-grain" />
      {children}
    </div>
  );
}
