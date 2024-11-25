
import { Navbar } from "../components/Navbar"

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div className="min-h-screen bg-gray-100">
           <Navbar/>
           {children}
       </div>
    )
  }