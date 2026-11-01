import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ProveedorSesion } from "@/context/SesionContext";
import { ProveedorTema } from "@/context/TemaContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "InventaVen Admin | Licencias y usuarios",
    template: "%s | InventaVen Admin",
  },
  description:
    "Administración central de usuarios y licencias de InventaVen.",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

const scriptTema = `(function(){try{var t=localStorage.getItem('inventaven-admin-tema');if(t==='oscuro'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.style.colorScheme='light';}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ProveedorTema>
          <ProveedorSesion>
            {children}
            <Toaster
              position="top-right"
              richColors
              toastOptions={{ style: { borderRadius: "12px" } }}
            />
          </ProveedorSesion>
        </ProveedorTema>
      </body>
    </html>
  );
}
